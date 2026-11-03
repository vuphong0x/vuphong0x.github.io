import {lessons} from './roadmap.mjs';
// Each lesson defines a measurable skill. Topic mapping is only for quiz relevance.
export const skills = lessons.map(({id, title, quizTopics}) => ({id, title, quizTopics}));
export const DEFAULT_WEIGHTS = {knowledge: 20, coding: 40, testing: 20, reasoning: 20};
export const dimensions = {
  knowledge: 'Kiến thức khái niệm',
  coding: 'Thực hành coding',
  testing: 'Kiểm chứng / testing',
  reasoning: 'Lập luận kỹ thuật',
};
export const STATUS_LABELS = {
  'not-started': 'Chưa bắt đầu',
  learning: 'Đang học',
  submitted: 'Đã nộp thực hành',
  'needs-review': 'Cần ôn lại',
  passed: 'Đạt rubric (tự đánh giá)',
  mastered: 'Vững qua follow-up (tự đánh giá)',
};
