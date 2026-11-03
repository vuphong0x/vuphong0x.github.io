import React from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import LearningLayout, {styles, Status} from './LearningLayout';
import AssessmentPanel from './AssessmentPanel';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {lessonById, lessonPath} from '../../data/learning/roadmap.mjs';
import {lessonStatus} from '../../services/learning/assessmentService.mjs';
import {questionsForLesson} from '../../services/learning/quizMapping.mjs';
function LessonDetail({lesson}) {
  const {data, ready, startLesson} = useLearningProgress();
  const progress = data.lessons[lesson.id];
  return (
    <article className={styles.detail}>
      <div className={styles.row}>
        <p className={styles.muted}>
          Giai đoạn {lesson.phase} · Tháng {lesson.month} · {lesson.estimatedMinutes} phút ·{' '}
          {lesson.category}
        </p>
        {ready && <Status value={lessonStatus(progress, lesson)} />}
      </div>
      {ready && !progress && (
        <button
          className="button button--primary"
          type="button"
          onClick={() => startLesson(lesson.id)}
        >
          Bắt đầu học
        </button>
      )}
      <section>
        <h2>Mục tiêu đo được</h2>
        <ul>
          {lesson.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <h3>Kiến thức trước</h3>
        {lesson.prerequisites.length ? (
          <ul>
            {lesson.prerequisites.map((id) => (
              <li key={id}>
                <Link to={lessonPath(id)}>{lessonById[id].title}</Link>
                {!data.lessons[id]?.assessments.length && (
                  <span className={styles.muted}> · chưa có đánh giá</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Kotlin cơ bản, unit test và một Android project chạy được.</p>
        )}
      </section>
      <section>
        <h2>Cơ chế và trade-offs</h2>
        {lesson.theory.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <h3>Tài liệu trong Knowledge Hub</h3>
        <ul>
          {lesson.docLinks.map((doc) => (
            <li key={doc.route}>
              <Link to={doc.route}>{doc.title}</Link>
            </li>
          ))}
        </ul>
        <p className={styles.muted}>
          Các bài tài liệu là nguồn giải thích kỹ thuật dùng chung; bài học này thêm mục tiêu, thực
          hành và rubric.
        </p>
      </section>
      <section>
        <h2>Ví dụ code</h2>
        {lesson.examples.map((example) => (
          <div key={example.code}>
            <CodeBlock language={example.language}>{example.code}</CodeBlock>
            <p>{example.explanation}</p>
          </div>
        ))}
      </section>
      {lesson.exercises.map((exercise) => (
        <section className={styles.card} key={exercise.kind}>
          <span className={styles.eyebrow}>
            {exercise.kind === 'guided' ? 'THỰC HÀNH CÓ HƯỚNG DẪN' : 'THỬ THÁCH ĐỘC LẬP'}
          </span>
          <h2>{exercise.title}</h2>
          {exercise.context && (
            <p>
              <strong>Bối cảnh: </strong>
              {exercise.context}
            </p>
          )}
          {exercise.steps && (
            <ol>
              {exercise.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {exercise.constraints && (
            <p>
              <strong>Ràng buộc: </strong>
              {exercise.constraints}
            </p>
          )}
          <p>
            <strong>Kết quả kỳ vọng: </strong>
            {exercise.expected}
          </p>
          {exercise.verification && (
            <p>
              <strong>Kiểm chứng: </strong>
              {exercise.verification}
            </p>
          )}
        </section>
      ))}
      {ready && <AssessmentPanel lesson={lesson} />}
      <section>
        <h2>Câu hỏi phỏng vấn Senior</h2>
        <ol>
          {lesson.reviewQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        {questionsForLesson(lesson.id).length > 0 ? (
          <Link className="button button--secondary" to={`/quiz?lesson=${lesson.id}`}>
            Ôn quiz liên quan ({questionsForLesson(lesson.id).length} câu) →
          </Link>
        ) : (
          <p className={styles.muted}>
            Chưa có câu quiz trong ngân hàng hiện tại phù hợp trực tiếp. Dùng câu hỏi lập luận và
            thực hành ở trên.
          </p>
        )}
      </section>
      {lesson.resources.length > 0 && (
        <section>
          <h2>Nguồn chính thức</h2>
          <ul>
            {lesson.resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link to="/learn/roadmap">← Trở về lộ trình</Link>
    </article>
  );
}
export default function LessonPage({lessonData}) {
  return (
    <LearningLayout title={lessonData.title} renderBeforeReady>
      <LessonDetail lesson={lessonData} />
    </LearningLayout>
  );
}
