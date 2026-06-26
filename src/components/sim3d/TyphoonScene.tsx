import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SIM, bandIntensity, cloudHeight, weather3D } from '../../game/sim3dConfig';

interface SceneProps {
  point: { x: number; z: number };
  setPoint: (p: { x: number; z: number }) => void;
  setDragging: (b: boolean) => void;
  dragging: boolean;
  showHeading: boolean;
  showSemicircle: boolean;
  showNames: boolean;
  paused: boolean;
  reduced: boolean;
  lowPerf: boolean;
  view: 'top' | 'tilt';
}

// 카메라 프리셋: 위에서 보기 / 비스듬히 보기
function CameraRig({ view }: { view: 'top' | 'tilt' }) {
  const { camera } = useThree();
  useEffect(() => {
    const target = view === 'top' ? new THREE.Vector3(0, 20, 0.01) : new THREE.Vector3(0, 12, 15);
    camera.position.copy(target);
    camera.lookAt(0, 0, 0);
  }, [view, camera]);
  return null;
}

// 나선 비구름대 구름 퍼프 위치 미리 계산
function useBandPuffs(lowPerf: boolean) {
  return useMemo(() => {
    const puffs: { x: number; z: number; h: number; s: number }[] = [];
    const radial = lowPerf ? 26 : 46;
    const ang = lowPerf ? 30 : 54;
    for (let i = 0; i < radial; i++) {
      const r = SIM.EYEWALL_R + (SIM.OUTER_R - SIM.EYEWALL_R) * (i / radial);
      for (let j = 0; j < ang; j++) {
        const a = (j / ang) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const b = bandIntensity(x, z);
        if (b > 0.5) {
          puffs.push({ x, z, h: cloudHeight(x, z), s: 0.35 + b * 0.5 });
        }
      }
    }
    return puffs;
  }, [lowPerf]);
}

export function TyphoonScene(props: SceneProps) {
  const { point, setPoint, setDragging, dragging, showHeading, showSemicircle, showNames, paused, reduced } = props;
  const cloudGroup = useRef<THREE.Group>(null);
  const puffs = useBandPuffs(props.lowPerf);

  // 태풍 반시계 회전
  useFrame((_, dt) => {
    if (cloudGroup.current && !paused) {
      const sp = SIM.ROTATION_SPEED * (reduced ? 0.3 : 1);
      cloudGroup.current.rotation.y += sp * dt; // +Y 회전(위에서 볼 때 반시계)
    }
  });

  const w = weather3D(point.x, point.z);
  const r = Math.hypot(point.x, point.z);

  // 드래그: 지표 평면에서 포인터 위치 갱신
  const onPlaneMove = (e: { point: THREE.Vector3; stopPropagation: () => void }) => {
    if (!dragging) return;
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
      <CameraRig view={props.view} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} />
      <directionalLight position={[-5, 6, -3]} intensity={0.3} />

      <OrbitControls
        enabled={!dragging}
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.25}
        minDistance={10}
        maxDistance={26}
        target={[0, 0, 0]}
      />

      {/* 지표면 (바다/대지) — 드래그 캡처 평면 겸용 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          setDragging(true);
          setPoint({ x: e.point.x, z: e.point.z });
        }}
        onPointerMove={onPlaneMove}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <circleGeometry args={[SIM.OUTER_R + 2, 64]} />
        <meshStandardMaterial color="#8fae8a" />
      </mesh>

      {/* 강풍반경 경계 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[SIM.OUTER_R - 0.06, SIM.OUTER_R, 64]} />
        <meshBasicMaterial color="#f1c40f" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* 위험/가항 반원 오버레이 */}
      {showSemicircle && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <circleGeometry args={[SIM.OUTER_R, 48, -Math.PI / 2, Math.PI]} />
            <meshBasicMaterial color="#e74c3c" transparent opacity={0.16} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <circleGeometry args={[SIM.OUTER_R, 48, Math.PI / 2, Math.PI]} />
            <meshBasicMaterial color="#3a7bd5" transparent opacity={0.16} side={THREE.DoubleSide} />
          </mesh>
          {showNames && (
            <>
              <Html position={[SIM.OUTER_R * 0.6, 0.2, 0]} center className="r3-label danger-label">위험반원</Html>
              <Html position={[-SIM.OUTER_R * 0.6, 0.2, 0]} center className="r3-label safe-label">가항반원</Html>
            </>
          )}
        </>
      )}

      {/* 진행 방향 화살표 (-Z = 북) */}
      {showHeading && (
        <group position={[0, 0.2, -(SIM.OUTER_R + 1.2)]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.5, 1.2, 16]} />
            <meshStandardMaterial color="#1f2a3a" />
          </mesh>
          {showNames && <Html position={[0, 0.6, -0.6]} center className="r3-label">진행 방향</Html>}
        </group>
      )}

      {/* 회전하는 구름 구조 */}
      <group ref={cloudGroup}>
        {/* 눈벽 (가장 높은 흰 고리) */}
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[(SIM.EYE_R + SIM.EYEWALL_R) / 2, (SIM.EYEWALL_R - SIM.EYE_R) / 2, 16, 48]} />
          <meshStandardMaterial color="#f5f8fc" roughness={0.9} />
        </mesh>
        {/* 나선 비구름대 퍼프 */}
        {puffs.map((p, i) => (
          <mesh key={i} position={[p.x, p.h * 0.5, p.z]}>
            <sphereGeometry args={[p.s, 8, 8]} />
            <meshStandardMaterial color="#e8eef6" transparent opacity={0.92} roughness={1} />
          </mesh>
        ))}
        {showNames && (
          <>
            <Html position={[0, 1.3, 0]} center className="r3-label">눈</Html>
            <Html position={[SIM.EYEWALL_R + 0.2, 1.1, 0]} center className="r3-label">눈벽</Html>
            <Html position={[SIM.OUTER_R * 0.6, 0.9, 0]} center className="r3-label">나선형 비구름대</Html>
          </>
        )}
      </group>

      {/* 눈 안쪽 바닥(지표 노출) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[SIM.EYE_R, 32]} />
        <meshStandardMaterial color="#9fc0d8" />
      </mesh>

      {/* 중심-관측점 연결선 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0.05, 0, point.x, 0.05, point.z]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#1d7fe0" />
      </line>

      {/* 관측 지점 */}
      <group position={[point.x, 0, point.z]}>
        <mesh
          position={[0, 0.5, 0]}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDragging(true);
          }}
          onPointerUp={() => setDragging(false)}
        >
          <coneGeometry args={[0.32, 1, 16]} />
          <meshStandardMaterial color="#1d7fe0" emissive="#0a3a66" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 24]} />
          <meshBasicMaterial color="#1d7fe0" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* 국소 강수 입자 (강수 세기에 비례, 가벼움) */}
        {w.precip > 0.6 &&
          Array.from({ length: Math.min(10, Math.round(w.precip * 4)) }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.9, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 0.9]}>
              <boxGeometry args={[0.03, 0.18, 0.03]} />
              <meshBasicMaterial color="#7fb0e6" />
            </mesh>
          ))}
        <Html position={[0, 1.2, 0]} center className="r3-point-tip">
          {w.regionName} · {w.windSpeed}m/s {r > SIM.EYE_R ? `· ${w.semicircle}` : ''}
        </Html>
      </group>
    </>
  );
}
