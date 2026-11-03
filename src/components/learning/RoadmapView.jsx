import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {lessons, phases, lessonPath} from '../../data/learning/roadmap.mjs';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {lessonStatus} from '../../services/learning/assessmentService.mjs';
import {styles, Status} from './LearningLayout';
export default function RoadmapView() {
  const {data} = useLearningProgress();
  const [query, setQuery] = useState('');
  return (
    <>
      <p>
        24 bài chuyên sâu, hai bài mỗi tháng. Bắt đầu từ kiến thức trước, thực hành theo tiêu chí và
        ghi bằng chứng để đánh giá tiến độ.
      </p>
      <label>
        Tìm bài học
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kotlin, offline, AI…"
        />
      </label>
      {phases.map((phase) => (
        <section key={phase.id}>
          <h2 className="margin-top--lg">
            {phase.id}. {phase.title}
          </h2>
          <div className={styles.months}>
            {[phase.id * 3 - 2, phase.id * 3 - 1, phase.id * 3].map((month) => (
              <section className={styles.card} key={month}>
                <h3>Tháng {month}</h3>
                {lessons
                  .filter(
                    (l) =>
                      l.month === month &&
                      `${l.title} ${l.category}`.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((l) => (
                    <div key={l.id} className={styles.lesson}>
                      <Link to={lessonPath(l.id)}>{l.title}</Link>
                      <p className={styles.muted}>
                        {l.estimatedMinutes} phút · {l.difficulty}
                      </p>
                      <Status value={lessonStatus(data.lessons[l.id], l)} />
                    </div>
                  ))}
              </section>
            ))}
          </div>
        </section>
      ))}
      {query &&
        !lessons.some((l) =>
          `${l.title} ${l.category}`.toLowerCase().includes(query.toLowerCase()),
        ) && <p role="status">Không tìm thấy bài học.</p>}
    </>
  );
}
