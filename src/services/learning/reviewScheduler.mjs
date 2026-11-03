export const DAY = 86400000;
export const REVIEW_DAYS = [1, 7, 30];
export function scheduleReview(previous, passed, at) {
  const time = Date.parse(at);
  if (!Number.isFinite(time)) throw new Error('Ngày ôn tập không hợp lệ.');
  const step = passed ? Math.min((previous?.step ?? -1) + 1, REVIEW_DAYS.length - 1) : 0;
  return {
    step,
    lastAt: new Date(time).toISOString(),
    dueAt: new Date(time + REVIEW_DAYS[step] * DAY).toISOString(),
    passed,
  };
}
export function isDue(review, now = Date.now()) {
  return Boolean(review && Date.parse(review.dueAt) <= now);
}
