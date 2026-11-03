import React from 'react';
import Link from '@docusaurus/Link';
import {lessons, phases, lessonPath} from '../../data/learning/roadmap.mjs';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {
  summarizeProgress,
  passes,
  lessonStatus,
} from '../../services/learning/assessmentService.mjs';
import {styles, Status, When} from './LearningLayout';
import ReviewQueue from './ReviewQueue';
export default function LearningDashboard() {
  const {data} = useLearningProgress();
  const summary = summarizeProgress(lessons, data.lessons);
  const completed = (lesson) => {
    const p = data.lessons[lesson.id],
      a = p?.assessments?.at(-1);
    return passes(
      a,
      p?.evidence?.find((e) => e.id === a?.evidenceId),
      lesson.assessment.criteria.length,
    );
  };
  const next =
    lessons.find(
      (l) =>
        !completed(l) && l.prerequisites.every((id) => completed(lessons.find((p) => p.id === id))),
    ) || lessons.find((l) => !completed(l));
  const currentPhase = phases.find((p) => p.id === (next?.phase || 4));
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekly = data.journal
    .filter(
      (e) =>
        new Date(`${e.date}T00:00:00`) >= weekStart &&
        e.date <= new Date().toLocaleDateString('sv-SE'),
    )
    .reduce((sum, e) => sum + e.minutes, 0);
  const activity = [
    ...data.journal.map((e) => ({
      id: e.id,
      at: e.at,
      text: `Nhật ký: ${e.minutes} phút — ${e.learned.slice(0, 100)}`,
      to: '/learn/journal',
    })),
    ...data.quizzes.map((q) => ({
      id: q.id,
      at: q.at,
      text: `Quiz: ${q.answers.filter((a) => a.correct).length}/${q.answers.length} câu đúng`,
      to: '/learn/skills',
    })),
    ...Object.entries(data.lessons).flatMap(([id, p]) => [
      ...p.evidence.map((e) => ({
        id: e.id,
        at: e.at,
        text: `Bằng chứng: ${lessons.find((l) => l.id === id).title}`,
        to: lessonPath(id),
      })),
      ...p.assessments.map((a) => ({
        id: a.id,
        at: a.at,
        text: `Tự đánh giá: ${lessons.find((l) => l.id === id).title}`,
        to: lessonPath(id),
      })),
    ]),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);
  return (
    <>
      <p>
        Lộ trình 12 tháng từ Middle Android tới năng lực Senior và Mobile AI. Tiến độ được tính từ
        thực hành và rubric tự đánh giá.
      </p>
      <div className={styles.stats}>
        <section className={styles.card}>
          <h2>Giai đoạn hiện tại</h2>
          <span className={styles.number}>{currentPhase.id} / 4</span>
          <p>
            {currentPhase.title}
            <br />
            <span className={styles.muted}>
              Tháng {currentPhase.months} · theo bài tiếp theo, không theo thời gian đã trôi.
            </span>
          </p>
        </section>
        <section className={styles.card}>
          <h2>Tiến độ lộ trình</h2>
          <span className={styles.number}>{summary.percent}%</span>
          <p>
            {summary.completed}/{summary.total} bài đạt rubric
          </p>
          <progress value={summary.completed} max={summary.total} aria-label="Bài học đạt rubric" />
        </section>
        <section className={styles.card}>
          <h2>Mục tiêu tuần</h2>
          <span className={styles.number}>
            {weekly} / {data.preferences.weeklyMinutes}
          </span>
          <p className={styles.muted}>Phút đã ghi trong nhật ký, từ thứ Hai.</p>
          <Link to="/learn/settings">Đổi mục tiêu</Link>
        </section>
      </div>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Bài tiếp theo</h2>
          {next ? (
            <>
              <p className={styles.muted}>
                Tháng {next.month} · {next.estimatedMinutes} phút dự kiến
              </p>
              <h3>
                <Link to={lessonPath(next.id)}>{next.title}</Link>
              </h3>
              <Status value={lessonStatus(data.lessons[next.id], next)} />
              <p>{next.objectives[0]}</p>
              <Link className="button button--primary" to={lessonPath(next.id)}>
                Mở bài học →
              </Link>
            </>
          ) : (
            <p>Bạn đã đạt rubric cho toàn bộ lộ trình. Tiếp tục ôn tập và thử biến thể độc lập.</p>
          )}
        </section>
        <section className={styles.card}>
          <h2>Tóm tắt kỹ năng</h2>
          <p>{summary.mastered} kỹ năng qua follow-up còn trong lịch ôn.</p>
          <p>
            {lessons.filter((l) => lessonStatus(data.lessons[l.id], l) === 'needs-review').length}{' '}
            kỹ năng cần ôn lại.
          </p>
          <p className={styles.muted}>
            Chưa có đánh giá thì chưa có điểm. Kết quả do bạn tự báo cáo, chưa được reviewer độc lập
            xác minh.
          </p>
          <Link to="/learn/skills">Xem rubric và điểm còn yếu →</Link>
        </section>
      </div>
      <div className={styles.grid}>
        <ReviewQueue />
        <section className={styles.card}>
          <h2>Hoạt động gần đây</h2>
          {activity.length ? (
            <ul className={styles.list}>
              {activity.map((e) => (
                <li key={e.id}>
                  <Link to={e.to}>{e.text}</Link>
                  <br />
                  <small>
                    <When at={e.at} />
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>Chưa có hoạt động. Mở bài đầu tiên, ghi bằng chứng hoặc thêm nhật ký để bắt đầu.</p>
          )}
          <Link to="/learn/journal">Ghi nhật ký →</Link>
        </section>
      </div>
      <p className={styles.muted}>
        Dữ liệu chỉ lưu trong trình duyệt của website này.{' '}
        <Link to="/learn/settings">Xuất JSON định kỳ</Link> để sao lưu hoặc chuyển thiết bị.
      </p>
    </>
  );
}
