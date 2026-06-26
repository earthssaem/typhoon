import { Canvas } from '@react-three/fiber';
import { TyphoonScene } from './TyphoonScene';

// three.js 번들을 지연 로딩하기 위한 래퍼 (React.lazy 대상)
interface Props {
  point: { x: number; z: number };
  setPoint: (p: { x: number; z: number }) => void;
  dragging: boolean;
  setDragging: (b: boolean) => void;
  showHeading: boolean;
  showSemicircle: boolean;
  showNames: boolean;
  paused: boolean;
  reduced: boolean;
  lowPerf: boolean;
  view: 'top' | 'tilt';
}

export default function Sim3DCanvas(p: Props) {
  return (
    <Canvas camera={{ position: [0, 12, 15], fov: 45 }} dpr={p.lowPerf ? 1 : [1, 2]}>
      <color attach="background" args={['#dfe9f4']} />
      <TyphoonScene
        point={p.point}
        setPoint={p.setPoint}
        dragging={p.dragging}
        setDragging={p.setDragging}
        showHeading={p.showHeading}
        showSemicircle={p.showSemicircle}
        showNames={p.showNames}
        paused={p.paused}
        reduced={p.reduced}
        lowPerf={p.lowPerf}
        view={p.view}
      />
    </Canvas>
  );
}
