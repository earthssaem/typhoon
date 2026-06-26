import type { CarrierItem } from '../types';

// STEP 7 캐리어 물품 (명세 5. STEP 7 물품 예시 기반)
// 캐리어 용량은 10칸. 물품별 차지 공간이 다르다.
export const CARRIER_CAPACITY = 10;

export const ITEMS: CarrierItem[] = [
  { id: 'tshirt', name: '반팔', emoji: '👕', slots: 1, category: 'top' },
  { id: 'thinLong', name: '얇은 긴팔', emoji: '🧥', slots: 1, category: 'top' },
  { id: 'hoodie', name: '후드/맨투맨', emoji: '👚', slots: 2, category: 'top' },
  { id: 'windbreaker', name: '바람막이', emoji: '🧥', slots: 1, category: 'outer' },
  { id: 'rainJacket', name: '방수 재킷', emoji: '🧥', slots: 2, category: 'outer' },
  { id: 'shorts', name: '반바지', emoji: '🩳', slots: 1, category: 'bottom' },
  { id: 'pants', name: '긴바지', emoji: '👖', slots: 1, category: 'bottom' },
  { id: 'sneakers', name: '운동화', emoji: '👟', slots: 2, category: 'shoes' },
  { id: 'waterShoes', name: '방수 신발', emoji: '🥾', slots: 2, category: 'shoes' },
  { id: 'umbrella', name: '접이식 우산', emoji: '🌂', slots: 1, category: 'rain' },
  { id: 'raincoat', name: '우비', emoji: '🧥', slots: 1, category: 'rain' },
  { id: 'socks', name: '여벌 양말', emoji: '🧦', slots: 1, category: 'extra' },
  { id: 'drybag', name: '방수팩', emoji: '🎒', slots: 1, category: 'extra' },
  { id: 'cap', name: '모자', emoji: '🧢', slots: 1, category: 'accessory' },
  { id: 'sunscreen', name: '선크림', emoji: '🧴', slots: 1, category: 'accessory' },
];

export function itemById(id: string): CarrierItem | undefined {
  return ITEMS.find((i) => i.id === id);
}
