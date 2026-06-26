import { Canvas } from '@react-three/fiber';
import { TyphoonScene } from './TyphoonScene';

// three.js 번들을 지연 로딩하기 위한 래퍼 (React.lazy 대상)
interface Props {
  point: { x: number; z: number };
  setPoint: (p: { x: number; z: number }) => void;
  moveMode: boolean;
  exitMoveMode: () => void;
  showHeading: boolean;
  showSemicircle: boolean;
  showNames: boolean;
  paused: boolean;
  reduced: boolean;
  lowPerf: boolean;
  view: 'top' | 'tilt';
  ab: { a: { x: number; z: number }; b: { x: number; z: number } };
}

export default function Sim3DCanvas(p: Props) {
  return (
    <Canvas
      camera={{ position: [0, 12, 14], fov: 45 }}
      dpr={p.lowPerf ? 1 : [1, 2]}
      style={{ position: 'absolute', inset: 0 }}
      resize={{ scroll: false }}
    >
      <color attach="background" args={['#e3edf6']} />
      <TyphoonScene
        point={p.point}
        setPoint={p.setPoint}
        moveMode={p.moveMode}
        exitMoveMode={p.exitMoveMode}
        showHeading={p.showHeading}
        showSemicircle={p.showSemicircle}
        showNames={p.showNames}
        paused={p.paused}
        reduced={p.reduced}
        lowPerf={p.lowPerf}
        view={p.view}
        ab={p.ab}
      />
    </Canvas>
  );
}
