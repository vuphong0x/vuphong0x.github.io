import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {lessons, lessonById, lessonPath} from '../../data/learning/roadmap.mjs';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {styles} from './LearningLayout';
export default function LearningJournal() {
  const {data, addJournal, removeJournal} = useLearningProgress();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const entries = data.journal
    .filter(
      (e) =>
        (filter === 'all' || e.lessonId === filter) &&
        [e.learned, e.problems, e.solutions, e.next, e.date]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at));
  return (
    <>
      <form
        className={`${styles.card} ${styles.stack}`}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const entry = Object.fromEntries(new FormData(form));
          entry.minutes = Number(entry.minutes);
          if (addJournal(entry)) {
            form.reset();
            setNotice('Đã lưu nhật ký.');
          }
        }}
      >
        <h2>Ghi một buổi học</h2>
        <div className={styles.grid}>
          <label>
            Ngày
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toLocaleDateString('sv-SE')}
            />
          </label>
          <label>
            Thời lượng (phút)
            <input name="minutes" type="number" min="1" max="1440" required />
          </label>
        </div>
        <label>
          Bài học
          <select name="lessonId">
            <option value="">Buổi học khác / capstone</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Đã học được gì?
          <textarea name="learned" required maxLength={20000} />
        </label>
        <label>
          Vấn đề gặp phải
          <textarea name="problems" maxLength={20000} />
        </label>
        <label>
          Giải pháp tìm được
          <textarea name="solutions" maxLength={20000} />
        </label>
        <label>
          Hành động tiếp theo
          <textarea name="next" maxLength={20000} />
        </label>
        <button className="button button--primary" type="submit">
          Lưu nhật ký
        </button>
        <span role="status">{notice}</span>
      </form>
      <div className={styles.grid}>
        <label>
          Lọc theo bài
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="">Buổi học khác / capstone</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tìm nội dung hoặc ngày
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <p>
        {entries.length} buổi · {entries.reduce((sum, e) => sum + e.minutes, 0)} phút đã ghi theo bộ
        lọc.
      </p>
      {!entries.length && (
        <p>Chưa có nhật ký phù hợp. Ghi một buổi học để bắt đầu theo dõi thời gian thực tế.</p>
      )}
      {entries.map((entry) => (
        <article key={entry.id} className={styles.card}>
          <div className={styles.row}>
            <h2>
              <time dateTime={entry.date}>{entry.date}</time> · {entry.minutes} phút
            </h2>
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => {
                if (removeJournal(entry.id)) setNotice('Đã xóa nhật ký.');
              }}
            >
              Xóa buổi {entry.date}
            </button>
          </div>
          {entry.lessonId && (
            <Link to={lessonPath(entry.lessonId)}>{lessonById[entry.lessonId].title}</Link>
          )}
          {[
            ['learned', 'Đã học'],
            ['problems', 'Vấn đề'],
            ['solutions', 'Giải pháp'],
            ['next', 'Tiếp theo'],
          ].map(
            ([key, label]) =>
              entry[key] && (
                <div key={key}>
                  <h3>{label}</h3>
                  <p style={{whiteSpace: 'pre-wrap'}}>{entry[key]}</p>
                </div>
              ),
          )}
        </article>
      ))}
    </>
  );
}
