import { PublicKey, clusterApiUrl } from '@solana/web3.js';

// ⚠️ 중요: anchor build 후 생성된 실제 Program ID로 교체하세요
export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

// 네트워크 설정
export const NETWORK = clusterApiUrl('devnet');

// 운동 종류 목록
export const EXERCISES = [
  '스쿼트',
  '벤치프레스', 
  '데드리프트',
  '오버헤드프레스',
  '바벨로우',
  '풀업',
  '딥스',
  '레그프레스',
  '레그컬',
  '레그익스텐션'
];

// 기본 휴식 시간 옵션 (초)
export const REST_TIME_OPTIONS = [60, 90, 120, 180];

// 기본 휴식 시간
export const DEFAULT_REST_TIME = 90;