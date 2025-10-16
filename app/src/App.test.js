import { EXERCISES } from './utils/constants';

test('기본 운동 목록이 포함되어 있다', () => {
  expect(EXERCISES).toContain('스쿼트');
  expect(EXERCISES.length).toBeGreaterThan(5);
});
