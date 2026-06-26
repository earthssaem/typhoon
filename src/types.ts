// ────────────────────────────────────────────────────────────────────────
// 공통 게임 엔진 타입 정의
// 명세 STEP 1~8 / 10. 구현 방식의 데이터 구조를 반영한다.
// ────────────────────────────────────────────────────────────────────────

export type DestinationId = 'seoul' | 'busan' | 'jeju';

export type StepId =
  | 'intro' // STEP 1 문제 상황
  | 'sim' // STEP 2 태풍 구조 시뮬레이터
  | 'destination' // STEP 3 목적지 선택
  | 'analysis' // STEP 4 일기도·위성·레이더 분석
  | 'track' // STEP 5 태풍 예상경로 분석
  | 'forecast' // STEP 6 최종 예보 카드
  | 'carrier' // STEP 7 캐리어 꾸리기
  | 'ending'; // STEP 8 실제 날씨 엔딩

// ── 예보 카드 선택지 (STEP 6) ─────────────────────────────────────────────
export type TempChoice = 'under18' | '18to22' | '22to26' | 'over26';
export type RainChoice = 'none' | 'weak' | 'continuous' | 'heavy';
export type WindChoice = 'weak' | 'somewhat' | 'umbrella' | 'outdoor';
export type ScheduleChoice = 'asPlanned' | 'shiftTime' | 'moveIndoor' | 'excludeArea';

// ── 경로 분석 판단 (STEP 5) ───────────────────────────────────────────────
export type ImpactChoice = 'none' | 'partial' | 'direct';
export type PositionChoice = 'outside' | 'navigable' | 'dangerous' | 'eyewall';

// ── 캐리어 물품 (STEP 7) ──────────────────────────────────────────────────
export interface CarrierItem {
  id: string;
  name: string;
  emoji: string;
  slots: number; // 차지하는 칸 수
  // 옷 입히기에서의 분류 (엔딩 캐릭터 렌더링용)
  category: 'top' | 'outer' | 'bottom' | 'shoes' | 'rain' | 'accessory' | 'extra';
}

// ── 사례 데이터팩 (목적지별) ───────────────────────────────────────────────
export interface ForecastTrackPoint {
  label: string; // 예: "현재", "+12h"
  x: number; // 지도 SVG 좌표(0~100 정규화)
  y: number;
  time: string;
  pressure?: number; // hPa
  maxWind?: number; // m/s
  // 예상경로 반경(정규화 단위, 지도 폭 기준)
  probRadius?: number; // 70% 확률반경
  strongWindRadius?: number; // 강풍반경
  stormRadius?: number; // 폭풍반경
}

// 사후 확인자료(엔딩에서 공개)
export interface ActualOutcome {
  trackPoints: { x: number; y: number }[]; // 실제 이동경로
  closestTime: string; // 최근접 시각
  semicircle: '위험반원' | '가항반원' | '영향권 밖';
  temp: number; // ℃
  rainfall: number; // mm
  wind: number; // m/s 평균 풍속
  maxGust: number; // m/s 최대순간풍속
  advisory: string; // 기상특보
  // 채점 기준이 되는 "정답" 예보
  correct: {
    temp: TempChoice;
    rain: RainChoice;
    wind: WindChoice;
    schedule: ScheduleChoice;
    impact: ImpactChoice;
    position: PositionChoice;
  };
}

export interface TyphoonCase {
  destination: DestinationId;
  cityName: string;
  cityX: number; // 지도상 목적지 위치(0~100)
  cityY: number;
  typhoonName: string;
  year: number;
  analysisTime: string; // 분석 시점
  note: string; // 사례 한줄 설명
  // ① 당시 관측·분석자료 (텍스트 설명 + SVG 합성영상 파라미터)
  weatherMap: string[]; // 일기도에서 확인할 점
  satellite: string[]; // 위성영상
  radar: string[]; // 레이더영상
  // ② 당시 태풍 예상자료
  track: ForecastTrackPoint[];
  trackSummary: {
    direction: string;
    speed: string;
    pressure: number;
    maxWind: number;
  };
  // ③ 사후 확인자료
  actual: ActualOutcome;
  // 근거 카드 후보 (STEP 6) — correct 표시 포함
  evidenceCards: { id: string; text: string; good: boolean }[];
  ending: {
    bgClass: string; // 엔딩 배경 CSS 클래스
    headline: string;
  };
}

// ── 전체 게임 진행 상태 ────────────────────────────────────────────────────
export interface GameState {
  step: StepId;
  visitedSim: boolean;
  destination: DestinationId | null;
  analysisViewed: { map: boolean; satellite: boolean; radar: boolean };
  trackJudgment: { impact: ImpactChoice | null; position: PositionChoice | null };
  forecast: {
    temp: TempChoice | null;
    rain: RainChoice | null;
    wind: WindChoice | null;
    schedule: ScheduleChoice | null;
  };
  evidence: string[]; // 선택한 근거 카드 id
  packed: string[]; // 캐리어에 담은 물품 id
}
