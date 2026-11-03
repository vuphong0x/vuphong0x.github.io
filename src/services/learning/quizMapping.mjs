import {ALL_QUESTIONS} from '../../data/quizQuestions.mjs';
import {lessons, lessonById} from '../../data/learning/roadmap.mjs';
const byQuestionId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
export function questionsForLesson(lessonId) {
  const lesson = lessonById[lessonId];
  if (!lesson) return [];
  return ALL_QUESTIONS.filter(
    (q) =>
      lesson.quizTopics.includes(q.topic) && lesson.relatedDocs.includes(q.docLink.split('#')[0]),
  );
}
export function skillsForQuestion(questionId) {
  const question = byQuestionId.get(questionId);
  if (!question) return [];
  return lessons
    .filter(
      (lesson) =>
        lesson.quizTopics.includes(question.topic) &&
        lesson.relatedDocs.includes(question.docLink.split('#')[0]),
    )
    .map((lesson) => lesson.id);
}
export function quizRecord(answers, {id, at, mode, lessonId = null}) {
  if (!answers.length) throw new Error('Không lưu phiên quiz rỗng.');
  return {
    id,
    at,
    mode,
    lessonId: lessonById[lessonId] ? lessonId : null,
    answers: answers.map((answer) => ({
      questionId: answer.question.id,
      correct: answer.isCorrect,
      selectedOriginal: answer.question.shuffledOptions[answer.selectedIdx]?.originalIdx ?? -1,
      points: answer.points,
    })),
    score: answers.reduce((sum, answer) => sum + answer.points, 0),
  };
}
export function questionById(id) {
  return byQuestionId.get(id);
}
