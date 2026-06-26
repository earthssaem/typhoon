import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  SIM,
  buildEyewallPuffs,
  buildBandPuffs,
  weather3D,
  type Puff,
} from '../../game/sim3dConfig';

interface SceneProps {
  point: { x: number; z: number };
  setPoint: (p: { x: number; z: number }) => void;
  showHeading: boolean;
  showSemicircle: boolean;
  showNames: boolean;
  paused: boolean;
  reduced: boolean;
  lowPerf: boolean;
  view: 'top' | 'tilt';
}

// 구름 덩어리(퍼프)를 InstancedMesh 한 번의 드로우콜로 그린다 — 성능 최적화
function PuffCloud({
  puffs,
  color,
  opacity = 1,
  squash = 0.8,
}: {
  puffs: Puff[];
  color: string;
  opacity?: number;
  squash?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    puffs.forEach((p, i) => {
      pos.set(p.x, p.y, p.z);
      scl.set(p.s, p.s * squash, p.s);
      m.compose(pos, q, scl);
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [puffs, squash]);
  return (
    <instancedMesh ref={ref} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, puffs.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={color} roughness={1} transparent={opacity < 1} opacity={opacity} />
    </instancedMesh>
  );
}

// 라벨 + 가는 연결선(리더)
function Label({ x, y, z, base, children, cls }: { x: number; y: number; z: number; base: number; children: React.ReactNode; cls?: string }) {
  return (
    <group>
      <mesh position={[x, (y + base) / 2, z]}>
        <cylinderGeometry args={[0.015, 0.015, y - base, 6]} />
        <meshBasicMaterial color="#5a6b80" />
      </mesh>
      <Html position={[x, y, z]} center className={`r3-label ${cls ?? ''}`}>{children}</Html>
    </group>
  );
}

export function TyphoonScene(props: SceneProps) {
  const { point, setPoint, showHeading, showSemicircle, showNames, paused, reduced, view } = props;
  const { camera } = useThree();
  const cloudGroup = useRef<THREE.Group>(null);
  const controls = useRef<{ enabled: boolean; update: () => void } | null>(null);
  const markerGroup = useRef<THREE.Group>(null);
  const lineAttr = useRef<THREE.BufferAttribute>(null);
  const disp = useRef(new THREE.Vector3(point.x, 0, point.z));

  const eyewallPuffs = useMemo(() => buildEyewallPuffs(props.lowPerf), [props.lowPerf]);
  const bandPuffs = useMemo(() => buildBandPuffs(props.lowPerf), [props.lowPerf]);

  const w = weather3D(point.x, point.z);

  // 카메라 부드러운 전환 애니메이션
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    const to = view === 'top' ? new THREE.Vector3(0, 24, 0.02) : new THREE.Vector3(0, 12, 14);
    anim.current = { from: camera.position.clone(), to, t: 0 };
  }, [view, camera]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    // 태풍 반시계 회전
    if (cloudGroup.current && !paused) {
      cloudGroup.current.rotation.y += SIM.ROTATION_SPEED * (reduced ? 0.3 : 1) * dt;
    }
    // 카메라 전환
    if (anim.current) {
      const a = anim.current;
      a.t = Math.min(1, a.t + dt / 0.6);
      const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2;
      camera.position.lerpVectors(a.from, a.to, e);
      camera.lookAt(0, 0, 0);
      controls.current?.update();
      if (a.t >= 1) anim.current = null;
    }
    // 관측 마커 부드러운 이동
    disp.current.lerp(new THREE.Vector3(point.x, 0, point.z), Math.min(1, dt * 8));
    if (markerGroup.current) markerGroup.current.position.set(disp.current.x, 0, disp.current.z);
    if (lineAttr.current) {
      const arr = lineAttr.current.array as Float32Array;
      arr[3] = disp.current.x;
      arr[5] = disp.current.z;
      lineAttr.current.needsUpdate = true;
    }
  });

  // 지표 클릭 → 관측점 이동 (드래그=회전과 충돌 없음: r3f onClick은 클릭에만 발생)
  const onGroundClick = (e: { point: THREE.Vector3; stopPropagation: () => void }) => {
    e.stopPropagation();
    const maxR = SIM.OUTER_R + 1.5;
    let x = e.point.x;
    let z = e.point.z;
    const d = Math.hypot(x, z);
    if (d > maxR) {
      x = (x / d) * maxR;
      z = (z / d) * maxR;
    }
    setPoint({ x, z });
  };

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 12, 4]} intensity={0.95} />
      <directionalLight position={[-5, 6, -3]} intensity={0.28} />

      <OrbitControls
        ref={controls as never}
        enablePan={false}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={28}
        target={[0, 0, 0]}
      />

      {/* 지표면 — 차분한 중성색, 이동 모드일 때 클릭 캡처 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onClick={onGroundClick}>
        <circleGeometry args={[SIM.OUTER_R + 2, 64]} />
        <meshStandardMaterial color="#b7c3cf" roughness={1} />
      </mesh>

      {/* 강풍반경 경계 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[SIM.OUTER_R - 0.06, SIM.OUTER_R, 64]} />
        <meshBasicMaterial color="#e0a92e" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* 위험/가항 반원 오버레이 (낮은 투명도) */}
      {showSemicircle && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <circleGeometry args={[SIM.OUTER_R, 48, -Math.PI / 2, Math.PI]} />
            <meshBasicMaterial color="#e74c3c" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <circleGeometry args={[SIM.OUTER_R, 48, Math.PI / 2, Math.PI]} />
            <meshBasicMaterial color="#3a7bd5" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          {showNames && (
            <>
              <Html position={[SIM.OUTER_R * 0.62, 0.15, 0]} center className="r3-label danger-label">위험반원</Html>
              <Html position={[-SIM.OUTER_R * 0.62, 0.15, 0]} center className="r3-label safe-label">가항반원</Html>
            </>
          )}
        </>
      )}

      {/* 진행 방향 화살표 (-Z = 북) : 중심에서 전방으로 */}
      {showHeading && (
        <group position={[0, 0.22, 0]}>
          <mesh position={[0, 0, -(SIM.OUTER_R * 0.55)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, SIM.OUTER_R * 1.0, 12]} />
            <meshStandardMaterial color="#2b3a4d" />
          </mesh>
          <mesh position={[0, 0, -(SIM.OUTER_R + 0.55)]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.42, 1.1, 16]} />
            <meshStandardMaterial color="#2b3a4d" />
          </mesh>
          {showNames && <Html position={[0, 0.5, -(SIM.OUTER_R + 1.2)]} center className="r3-label">진행 방향</Html>}
        </group>
      )}

      {/* 회전하는 구름 구조: 눈벽(가장 높음) + 나선 비구름대(낮음) */}
      <group ref={cloudGroup}>
        <PuffCloud puffs={eyewallPuffs} color="#fbfdff" squash={0.95} />
        <PuffCloud puffs={bandPuffs} color="#dde6f0" opacity={0.9} squash={0.7} />
      </group>

      {/* 눈 안쪽 바닥(지표 노출) + 중심 표시 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[SIM.EYE_R, 32]} />
        <meshStandardMaterial color="#9fb6cc" roughness={1} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.7, 8]} />
        <meshStandardMaterial color="#5a6b80" />
      </mesh>

      {/* 구조 라벨 (구조 이름 켤 때만) */}
      {showNames && (
        <>
          <Label x={0} y={1.5} z={0} base={0.4} cls="">태풍의 눈</Label>
          <Label x={SIM.EYEWALL_R + 0.5} y={2.35} z={0} base={1.9}>눈벽</Label>
          <Label x={SIM.OUTER_R * 0.6} y={1.25} z={SIM.OUTER_R * 0.18} base={0.5}>나선형 비구름대</Label>
        </>
      )}

      {/* 중심-관측점 연결선 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={lineAttr as never}
            attach="attributes-position"
            args={[new Float32Array([0, 0.06, 0, point.x, 0.06, point.z]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#1d7fe0" />
      </line>

      {/* 관측 지점 (부드럽게 이동) */}
      <group ref={markerGroup} position={[point.x, 0, point.z]}>
        <mesh position={[0, 0.55, 0]}>
          <coneGeometry args={[0.3, 1, 16]} />
          <meshStandardMaterial color="#1d7fe0" emissive="#0a3a66" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.6, 24]} />
          <meshBasicMaterial color="#1d7fe0" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 1.25, 0]} center className="r3-point-tip">
          {w.regionName} · {w.windSpeed}m/s
        </Html>
      </group>
    </>
  );
}
