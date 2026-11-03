import React, {useState} from 'react';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {dimensions} from '../../data/learning/skillDefinitions.mjs';
import {SCORE_LEVELS, scoreAssessment} from '../../services/learning/assessmentService.mjs';
import {styles, When} from './LearningLayout';
export default function AssessmentPanel({lesson}) {
  const {data, addEvidence, assess, checkCriterion} = useLearningProgress();
  const progress = data.lessons[lesson.id];
  const [notice, setNotice] = useState('');
  const [evidenceId, setEvidenceId] = useState('');
  const [scores, setScores] = useState({knowledge: 0, coding: 0, testing: 0, reasoning: 0});
  const [followUp, setFollowUp] = useState(false);
  const submitEvidence = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (addEvidence(lesson.id, values)) {
      form.reset();
      setNotice('Đã lưu bằng chứng. Chọn bằng chứng này trong rubric để đánh giá.');
    }
  };
  return (
    <>
      <section>
        <h2>Tiêu chí hoàn thành</h2>
        <p className={styles.muted}>
          Checklist là tự báo cáo. Đánh dấu chưa làm bài đạt rubric; mỗi lần đánh giá lưu một bản
          checklist riêng.
        </p>
        <div className={styles.stack}>
          {lesson.assessment.criteria.map((text, index) => (
            <label className={styles.check} key={text}>
              <input
                type="checkbox"
                checked={progress?.checklist[index] || false}
                onChange={(e) => checkCriterion(lesson.id, index, e.target.checked)}
              />
              {text}
            </label>
          ))}
        </div>
      </section>
      <section className={styles.card}>
        <h2>Nộp bằng chứng thực hành</h2>
        <p>{lesson.assessment.evidence}</p>
        <form className={styles.stack} onSubmit={submitEvidence}>
          <label>
            Loại thực hành
            <select name="kind">
              <option value="guided">Có hướng dẫn</option>
              <option value="independent">Thử thách độc lập</option>
              <option value="follow-up">Follow-up mới</option>
            </select>
          </label>
          <label>
            Đã triển khai gì? <textarea name="implementation" required maxLength={20000} />
          </label>
          <label>
            URL commit, PR hoặc artifact (tùy chọn)
            <input name="url" type="url" maxLength={2000} placeholder="https://github.com/…" />
          </label>
          <label>
            Kết quả kiểm chứng (tự báo cáo)
            <textarea
              name="tests"
              maxLength={20000}
              placeholder="Lệnh, môi trường, kết quả và failure case đã thử"
            />
          </label>
          <label>
            Lập luận và trade-offs
            <textarea name="reasoning" maxLength={20000} />
          </label>
          <button className="button button--primary" type="submit">
            Lưu bằng chứng
          </button>
        </form>
      </section>
      <section className={styles.card}>
        <h2>Rubric tự đánh giá</h2>
        <p>
          Điểm 0–4 theo bằng chứng. Mặc định: kiến thức 20%, coding 40%, testing 20%, lập luận 20%.
          Trọng số có thể đổi ở mục tùy chọn; đây không phải thang đo đã được khoa học xác thực.
        </p>
        <p>
          Đạt: đủ tiêu chí, có triển khai + test + lập luận, mọi chiều ≥ 3 và tổng ≥ 75%. Vững: đạt
          follow-up với bằng chứng mới sau lần đạt trước ít nhất 24 giờ.
        </p>
        <form
          className={styles.stack}
          onSubmit={(e) => {
            e.preventDefault();
            if (assess(lesson.id, {scores, evidenceId, followUp}))
              setNotice('Đã ghi đánh giá và cập nhật lịch ôn tập.');
          }}
        >
          <label>
            Bằng chứng được đánh giá
            <select required value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}>
              <option value="">Chọn bằng chứng…</option>
              {(progress?.evidence || []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.kind} · {e.implementation.slice(0, 80)} ·{' '}
                  {new Date(e.at).toLocaleDateString('vi-VN')}
                </option>
              ))}
            </select>
          </label>
          {Object.entries(dimensions).map(([key, label]) => (
            <label key={key}>
              {label} ({data.preferences.weights[key]} phần trọng số)
              <select
                value={scores[key]}
                onChange={(e) => setScores({...scores, [key]: Number(e.target.value)})}
              >
                {SCORE_LEVELS.map((text, i) => (
                  <option key={text} value={i}>
                    {i} — {text}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={followUp}
              onChange={(e) => setFollowUp(e.target.checked)}
            />
            Đây là follow-up độc lập: {lesson.assessment.followUp}
          </label>
          <p>
            Tổng theo trọng số hiện tại: {scoreAssessment(scores, data.preferences.weights)}% · tự
            đánh giá
          </p>
          <button
            className="button button--primary"
            type="submit"
            disabled={!progress?.evidence.length}
          >
            Ghi đánh giá
          </button>
        </form>
      </section>
      <p role="status">{notice}</p>
      <section>
        <h2>Bằng chứng đã lưu</h2>
        {!progress?.evidence.length ? (
          <p>Chưa nộp bằng chứng.</p>
        ) : (
          progress.evidence
            .slice()
            .reverse()
            .map((e) => (
              <details className={styles.card} key={e.id}>
                <summary>
                  {e.kind}: {e.implementation.slice(0, 90)}
                </summary>
                <p>
                  <When at={e.at} />
                </p>
                <p style={{whiteSpace: 'pre-wrap'}}>{e.implementation}</p>
                {e.url && (
                  <p>
                    <a href={e.url} target="_blank" rel="noreferrer">
                      Mở artifact ↗
                    </a>
                  </p>
                )}
                <h3>Kiểm chứng (tự báo cáo)</h3>
                <p style={{whiteSpace: 'pre-wrap'}}>{e.tests || 'Chưa ghi kết quả.'}</p>
                <h3>Lập luận</h3>
                <p style={{whiteSpace: 'pre-wrap'}}>{e.reasoning || 'Chưa ghi lập luận.'}</p>
              </details>
            ))
        )}
      </section>
      <section>
        <h2>Lịch sử đánh giá</h2>
        {!progress?.assessments.length ? (
          <p>Chưa có đánh giá.</p>
        ) : (
          <ul className={styles.list}>
            {progress.assessments
              .slice()
              .reverse()
              .map((a) => (
                <li key={a.id}>
                  <When at={a.at} /> · {scoreAssessment(a.scores, a.weights)}% ·{' '}
                  {a.followUp ? 'follow-up' : 'tự đánh giá'}
                  <br />
                  <span className={styles.muted}>
                    {Object.entries(dimensions)
                      .map(([key, label]) => `${label}: ${a.scores[key]}/4`)
                      .join(' · ')}{' '}
                    · Bằng chứng {a.evidenceId}
                  </span>
                </li>
              ))}
          </ul>
        )}
        {progress?.review && (
          <p>
            Ôn tiếp theo: <When at={progress.review.dueAt} />
          </p>
        )}
      </section>
    </>
  );
}
