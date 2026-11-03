import {DEFAULT_WEIGHTS} from '../../data/learning/skillDefinitions.mjs';
import {DAY, isDue, scheduleReview} from './reviewScheduler.mjs';
export const SCORE_LEVELS = [
  'Chưa có bằng chứng',
  'Chỉ mô tả được',
  'Làm được với hướng dẫn',
  'Tự thực hiện, có bằng chứng',
  'Giải thích và xử lý biến thể',
];
export function scoreAssessment(scores, weights = DEFAULT_WEIGHTS) {
  const keys = Object.keys(DEFAULT_WEIGHTS);
  if (
    !keys.every(
      (key) =>
        Number.isInteger(scores?.[key]) &&
        scores[key] >= 0 &&
        scores[key] <= 4 &&
        Number.isFinite(weights[key]) &&
        weights[key] > 0,
    )
  )
    throw new Error('Rubric cần đủ bốn chiều, điểm nguyên 0–4 và trọng số dương.');
  const total = keys.reduce((sum, key) => sum + weights[key], 0);
  if (!Number.isFinite(total)) throw new Error('Tổng trọng số phải hữu hạn.');
  return Math.round(
    (keys.reduce((sum, key) => sum + (scores[key] / 4) * weights[key], 0) / total) * 100,
  );
}
export function passes(attempt, evidence, criteriaCount) {
  return Boolean(
    attempt &&
      evidence &&
      evidence.implementation?.trim() &&
      evidence.tests?.trim() &&
      evidence.reasoning?.trim() &&
      attempt.criteria?.length === criteriaCount &&
      attempt.criteria.every((value) => value === true) &&
      Object.values(attempt.scores).every((value) => value >= 3) &&
      scoreAssessment(attempt.scores, attempt.weights) >= 75,
  );
}
export function isMastered(progress, criteriaCount) {
  const history = progress?.assessments || [];
  const latest = history.at(-1);
  const evidence = progress?.evidence?.find((item) => item.id === latest?.evidenceId);
  if (
    !latest?.followUp ||
    evidence?.kind !== 'follow-up' ||
    !passes(latest, evidence, criteriaCount)
  )
    return false;
  return history.slice(0, -1).some(
    (previous) =>
      previous.evidenceId !== latest.evidenceId &&
      Date.parse(latest.at) - Date.parse(previous.at) >= DAY &&
      Date.parse(evidence.at) - Date.parse(previous.at) >= DAY &&
      passes(
        previous,
        progress.evidence.find((item) => item.id === previous.evidenceId),
        criteriaCount,
      ),
  );
}
export function lessonStatus(progress, lesson, now = Date.now()) {
  if (!progress) return 'not-started';
  const latest = progress.assessments?.at(-1);
  if (latest) {
    const evidence = progress.evidence?.find((item) => item.id === latest.evidenceId);
    if (!passes(latest, evidence, lesson.assessment.criteria.length) || isDue(progress.review, now))
      return 'needs-review';
    return isMastered(progress, lesson.assessment.criteria.length) ? 'mastered' : 'passed';
  }
  if (progress.evidence?.length) return 'submitted';
  return 'learning';
}
export function summarizeProgress(lessons, progress, now = Date.now()) {
  const states = lessons.map((lesson) => lessonStatus(progress[lesson.id], lesson, now));
  // Completion is evidence-based rubric pass; overdue review does not erase historical work.
  const completed = lessons.filter((lesson) => {
    const p = progress[lesson.id];
    const last = p?.assessments?.at(-1);
    return passes(
      last,
      p?.evidence?.find((e) => e.id === last?.evidenceId),
      lesson.assessment.criteria.length,
    );
  }).length;
  return {
    completed,
    total: lessons.length,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    mastered: states.filter((s) => s === 'mastered').length,
  };
}
export function recordAssessment(progress, lesson, input, at, id) {
  const scores = {...input.scores};
  scoreAssessment(scores, input.weights);
  const evidence = progress?.evidence?.find((item) => item.id === input.evidenceId);
  if (!evidence) throw new Error('Chọn bằng chứng thực hành trước khi đánh giá.');
  if (Date.parse(at) < Date.parse(evidence.at))
    throw new Error('Đánh giá không thể trước bằng chứng.');
  const attempt = {
    id,
    at,
    evidenceId: evidence.id,
    scores,
    weights: {...(input.weights || DEFAULT_WEIGHTS)},
    criteria: [...input.criteria],
    followUp: Boolean(input.followUp),
    source: 'self-reported',
  };
  const passed = passes(attempt, evidence, lesson.assessment.criteria.length);
  if (
    attempt.followUp &&
    !isMastered(
      {...progress, assessments: [...(progress.assessments || []), attempt]},
      lesson.assessment.criteria.length,
    )
  ) {
    throw new Error(
      'Follow-up cần bằng chứng mới loại follow-up, đạt rubric, sau lần đạt trước ít nhất 24 giờ.',
    );
  }
  return {
    ...progress,
    assessments: [...(progress.assessments || []), attempt],
    review: scheduleReview(progress.review, passed, at),
  };
}
