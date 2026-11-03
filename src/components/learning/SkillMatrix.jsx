import React from 'react';
import Link from '@docusaurus/Link';
import {lessons, lessonPath} from '../../data/learning/roadmap.mjs';
import {dimensions} from '../../data/learning/skillDefinitions.mjs';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {lessonStatus, scoreAssessment} from '../../services/learning/assessmentService.mjs';
import {skillsForQuestion, questionById} from '../../services/learning/quizMapping.mjs';
import {styles, Status, When} from './LearningLayout';
export default function SkillMatrix() {
  const {data} = useLearningProgress();
  return (
    <>
      <p>
        Mỗi bài là một kỹ năng có rubric. Điểm và kết quả test dưới đây do bạn tự báo cáo; quiz được
        lưu riêng và không tự nâng trạng thái thực hành.
      </p>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Kỹ năng</th>
              <th>Trạng thái</th>
              <th>Rubric mới nhất</th>
              <th>Chiều cần củng cố</th>
              <th>Quiz liên quan</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => {
              const a = data.lessons[l.id]?.assessments.at(-1);
              const quizAnswers = data.quizzes
                .flatMap((q) => q.answers)
                .filter((answer) => skillsForQuestion(answer.questionId).includes(l.id));
              const weak = a
                ? Object.entries(dimensions)
                    .filter(([key]) => a.scores[key] < 3)
                    .map(([, label]) => label)
                : [];
              return (
                <tr key={l.id}>
                  <td>
                    <Link to={lessonPath(l.id)}>{l.title}</Link>
                  </td>
                  <td>
                    <Status value={lessonStatus(data.lessons[l.id], l)} />
                  </td>
                  <td>
                    {a ? `${scoreAssessment(a.scores, a.weights)}% · tự đánh giá` : 'Chưa đánh giá'}
                  </td>
                  <td>{a ? weak.join(', ') || 'Không chiều nào dưới 3/4' : 'Chưa đủ dữ liệu'}</td>
                  <td>
                    {quizAnswers.length
                      ? `${quizAnswers.filter((a) => a.correct).length}/${quizAnswers.length} lượt trả lời đúng`
                      : 'Chưa có lượt trả lời'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section className={styles.card}>
        <h2>Lịch sử quiz</h2>
        {!data.quizzes.length ? (
          <p>
            Chưa hoàn tất phiên quiz nào. <Link to="/quiz">Mở Quiz</Link> để ôn tập.
          </p>
        ) : (
          <>
            <p>
              <Link to="/quiz?review=wrong">Luyện lại các câu đã trả lời sai →</Link>
            </p>
            {data.quizzes
              .slice()
              .reverse()
              .map((q) => (
                <details key={q.id}>
                  <summary>
                    <When at={q.at} /> · {q.answers.filter((a) => a.correct).length}/
                    {q.answers.length} đúng · {q.score} điểm · {q.mode}
                  </summary>
                  {q.lessonId && (
                    <p>
                      <Link to={lessonPath(q.lessonId)}>Trở về bài học</Link>
                    </p>
                  )}
                  <ul className={styles.list}>
                    {q.answers.map((a) => {
                      const question = questionById(a.questionId);
                      return (
                        <li key={a.questionId}>
                          <strong>{a.correct ? 'Đúng' : 'Sai'}</strong> · {question.question}
                          <br />
                          <span className={styles.muted}>
                            Bạn chọn:{' '}
                            {a.selectedOriginal < 0
                              ? 'Hết giờ'
                              : question.options[a.selectedOriginal]}
                            <br />
                            Đáp án: {question.options[question.correct]}
                          </span>
                          {!a.correct && (
                            <>
                              <p>{question.explanation}</p>
                              <Link to={question.docLink}>Đọc tài liệu liên quan</Link>
                              {skillsForQuestion(question.id).map((id) => (
                                <p key={id}>
                                  <Link to={lessonPath(id)}>
                                    Học lại: {lessons.find((l) => l.id === id).title}
                                  </Link>
                                </p>
                              ))}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ))}
          </>
        )}
      </section>
    </>
  );
}
