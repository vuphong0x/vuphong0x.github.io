import React from 'react';
import Link from '@docusaurus/Link';
import {lessons, lessonPath} from '../../data/learning/roadmap.mjs';
import {isDue} from '../../services/learning/reviewScheduler.mjs';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {scoreAssessment} from '../../services/learning/assessmentService.mjs';
import {styles, When} from './LearningLayout';
export default function ReviewQueue() {
  const {data} = useLearningProgress();
  const scheduled = lessons
    .filter((l) => data.lessons[l.id]?.review)
    .sort((a, b) => data.lessons[a.id].review.dueAt.localeCompare(data.lessons[b.id].review.dueAt));
  return (
    <section className={styles.card}>
      <h2>Lịch ôn tập</h2>
      <p className={styles.muted}>
        Khoảng cách mặc định 1, 7, 30 ngày; lần chưa đạt quay về 1 ngày. Đây là cấu hình khởi đầu,
        không phải khoảng cách tối ưu cho mọi người.
      </p>
      {!scheduled.length ? (
        <p>Chưa có lịch ôn. Hoàn thành một lần đánh giá để tạo lịch.</p>
      ) : (
        <ul className={styles.list}>
          {scheduled.map((lesson) => {
            const p = data.lessons[lesson.id];
            const a = p.assessments.at(-1);
            return (
              <li key={lesson.id}>
                <Link to={lessonPath(lesson.id)}>{lesson.title}</Link>
                <br />
                <strong>{isDue(p.review) ? 'Đến hạn' : 'Sắp tới'}</strong> ·{' '}
                <When at={p.review.dueAt} />
                <br />
                <span className={styles.muted}>
                  Lần trước: {scoreAssessment(a.scores, a.weights)}% (tự đánh giá) ·{' '}
                  <When at={a.at} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
