import type { GameState, TyphoonCase, DestinationId } from '../types';
import { itemById } from '../data/items';
import {
  recommendedItems,
  scoreGame,
  dressCharacter,
  tempKo,
  rainKo,
  windKo,
  scheduleKo,
  type DressResult,
} from './scoring';

// ────────────────────────────────────────────────────────────────────────
// 엔딩 규칙 기반 평가 — 화면(표현)과 데이터(판정)를 분리한다.
// 이후 AI 피드백을 붙일 수 있도록 구조화된 객체를 반환한다.
// ────────────────────────────────────────────────────────────────────────

export interface ActualWeatherView {
  temp: number;
  rainfall: number;
  wind: number;
  maxGust: number;
  advisory: string;
  closestTime: string;
  semicircle: string;
  // 날씨 효과 분기용 플래그
  rainy: boolean;
  windy: boolean;
  cold: boolean;
  hot: boolean;
}

export interface CompareLine {
  label: string;
  ok: boolean;
  sentence: string;
}

export interface EndingResult {
  destination: DestinationId;
  cityName: string;
  actualWeather: ActualWeatherView;
  predictedWeather: GameState['forecast'];
  selectedItems: string[];
  itemMatches: { id: string; name: string; reason: string }[];
  missingItems: { id: string; name: string; reason: string }[];
  unnecessaryItems: { id: string; name: string }[];
  weatherResult: CompareLine[];
  scheduleResult: CompareLine;
  dress: DressResult;
  overallResult: {
    grade: string;
    total: number;
    max: number;
    headline: string;
  };
  // 구체 피드백 문장
  feedback: string[];
}

export function evaluateEnding(state: GameState, c: TyphoonCase): EndingResult {
  const a = c.actual;
  const rec = recommendedItems(c);
  const recIds = new Set(rec.map((r) => r.id));
  const packed = state.packed;

  const itemMatches = rec
    .filter((r) => packed.includes(r.id))
    .map((r) => ({ id: r.id, name: itemById(r.id)?.name ?? r.id, reason: r.reason }));
  const missingItems = rec
    .filter((r) => !packed.includes(r.id))
    .map((r) => ({ id: r.id, name: itemById(r.id)?.name ?? r.id, reason: r.reason }));
  const unnecessaryItems = packed
    .filter((id) => !recIds.has(id))
    .map((id) => ({ id, name: itemById(id)?.name ?? id }));

  // 날씨 판단 비교 (예측 vs 실제 정답)
  const weatherResult: CompareLine[] = [
    {
      label: '기온',
      ok: state.forecast.temp === a.correct.temp,
      sentence:
        state.forecast.temp === a.correct.temp
          ? `기온을 ${tempKo(a.correct.temp)}로 적절히 판단했습니다.`
          : `기온을 ${tempKo(state.forecast.temp)}로 보았지만 실제는 ${a.temp}℃(${tempKo(a.correct.temp)})였습니다.`,
    },
    {
      label: '강수',
      ok: state.forecast.rain === a.correct.rain,
      sentence:
        state.forecast.rain === a.correct.rain
          ? `강수를 ${rainKo(a.correct.rain)}로 잘 예상했습니다.`
          : `강수를 ${rainKo(state.forecast.rain)}로 보았지만 실제 강수량은 ${a.rainfall}mm(${rainKo(a.correct.rain)})였습니다.`,
    },
    {
      label: '바람',
      ok: state.forecast.wind === a.correct.wind,
      sentence:
        state.forecast.wind === a.correct.wind
          ? `바람을 ${windKo(a.correct.wind)} 수준으로 적절히 판단했습니다.`
          : `바람을 ${windKo(state.forecast.wind)}로 보았지만 실제 최대순간풍속은 ${a.maxGust}m/s(${windKo(a.correct.wind)})였습니다.`,
    },
  ];

  const scheduleResult: CompareLine = {
    label: '일정',
    ok: state.forecast.schedule === a.correct.schedule,
    sentence:
      state.forecast.schedule === a.correct.schedule
        ? `일정을 '${scheduleKo(a.correct.schedule)}'으로 알맞게 결정했습니다.`
        : `일정을 '${scheduleKo(state.forecast.schedule)}'으로 정했지만, 실제 날씨에는 '${scheduleKo(a.correct.schedule)}'이 더 적절했습니다.`,
  };

  const dress = dressCharacter(state, c);
  const score = scoreGame(state, c);

  // 구체 피드백 문장 (날씨/일정/준비물)
  const feedback: string[] = [];
  weatherResult.forEach((w) => feedback.push(w.sentence));
  feedback.push(scheduleResult.sentence);
  itemMatches.slice(0, 2).forEach((m) =>
    feedback.push(`${m.reason}: ${m.name}을(를) 챙긴 선택이 적절했습니다.`),
  );
  missingItems.slice(0, 2).forEach((m) =>
    feedback.push(`${m.reason}을(를) 고려해 ${m.name}을(를) 챙겼다면 더 좋았을 거예요.`),
  );
  if (unnecessaryItems.length > 0) {
    feedback.push(
      `${unnecessaryItems.map((u) => u.name).join(', ')}은(는) 이번 날씨에는 필요성이 낮았습니다.`,
    );
  }

  return {
    destination: c.destination,
    cityName: c.cityName,
    actualWeather: {
      temp: a.temp,
      rainfall: a.rainfall,
      wind: a.wind,
      maxGust: a.maxGust,
      advisory: a.advisory,
      closestTime: a.closestTime,
      semicircle: a.semicircle,
      rainy: a.rainfall >= 30,
      windy: a.maxGust >= 25,
      cold: a.temp < 20,
      hot: a.temp >= 26,
    },
    predictedWeather: state.forecast,
    selectedItems: packed,
    itemMatches,
    missingItems,
    unnecessaryItems,
    weatherResult,
    scheduleResult,
    dress,
    overallResult: {
      grade: score.grade,
      total: score.total,
      max: score.max,
      headline: c.ending.headline,
    },
    feedback,
  };
}
