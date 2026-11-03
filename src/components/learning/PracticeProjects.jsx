import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {milestones} from '../../data/learning/projects.mjs';
import {lessonById, lessonPath} from '../../data/learning/roadmap.mjs';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {styles} from './LearningLayout';
function Milestone({item, index}) {
  const {data, saveProject} = useLearningProgress();
  const saved = data.projects[item.id];
  const [draft, setDraft] = useState(
    saved || {notes: '', evidence: '', criteria: item.criteria.map(() => false), completed: false},
  );
  const [notice, setNotice] = useState('');
  const edit = (change) => {
    setDraft((previous) => ({...previous, ...change, completed: false}));
    setNotice('Chưa lưu thay đổi.');
  };
  const canComplete = Boolean(draft.evidence.trim()) && draft.criteria.every(Boolean);
  return (
    <section className={styles.card}>
      <div className={styles.row}>
        <h2>
          {index + 1}. {item.title}
        </h2>
        <span className={styles.status}>
          {saved?.completed ? 'Hoàn tất · tự báo cáo' : saved ? 'Đang thực hiện' : 'Chưa bắt đầu'}
        </span>
      </div>
      <h3>Đầu ra</h3>
      <ul>
        {item.deliverables.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p>
        <strong>Yêu cầu kỹ thuật: </strong>
        {item.requirements}
      </p>
      <p>
        Bài liên quan:{' '}
        {item.lessons.map((id, i) => (
          <React.Fragment key={id}>
            {i > 0 && ' · '}
            <Link to={lessonPath(id)}>{lessonById[id].title}</Link>
          </React.Fragment>
        ))}
      </p>
      <form
        className={styles.stack}
        onSubmit={(e) => {
          e.preventDefault();
          if (saveProject(item.id, draft)) setNotice('Đã lưu milestone.');
        }}
      >
        <fieldset>
          <legend>Acceptance criteria (tự báo cáo)</legend>
          <div className={styles.stack}>
            {item.criteria.map((text, i) => (
              <label key={text} className={styles.check}>
                <input
                  type="checkbox"
                  checked={draft.criteria[i]}
                  onChange={(e) =>
                    edit({criteria: draft.criteria.map((v, n) => (n === i ? e.target.checked : v))})
                  }
                />
                {text}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          URL bằng chứng / repository
          <input
            type="url"
            value={draft.evidence}
            maxLength={2000}
            onChange={(e) => edit({evidence: e.target.value})}
          />
        </label>
        <label>
          Ghi chú cá nhân
          <textarea
            value={draft.notes}
            maxLength={20000}
            onChange={(e) => edit({notes: e.target.value})}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.completed}
            disabled={!canComplete}
            onChange={(e) => setDraft({...draft, completed: e.target.checked})}
          />
          Ghi nhận hoàn tất milestone (cần bằng chứng và đủ tiêu chí)
        </label>
        <div className={styles.actions}>
          <button type="submit" className="button button--primary">
            Lưu milestone {index + 1}
          </button>
          <span role="status">{notice}</span>
        </div>
      </form>
    </section>
  );
}
export default function PracticeProjects() {
  const {data} = useLearningProgress();
  return (
    <>
      <p>
        Capstone: Android AI phân tích chuyển động từ video. Tám milestone dưới đây là đề thực hành;
        bạn triển khai trong Android repository riêng và lưu bằng chứng ở đây.
      </p>
      <p>
        {Object.values(data.projects).filter((p) => p.completed).length}/{milestones.length}{' '}
        milestone đã ghi nhận hoàn tất. Đây là tự báo cáo, chưa xác minh độc lập.
      </p>
      {milestones.map((item, index) => (
        <Milestone key={item.id} item={item} index={index} />
      ))}
    </>
  );
}
