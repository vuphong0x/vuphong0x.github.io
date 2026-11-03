import React, {useState} from 'react';
import {useLearningProgress} from '../../hooks/useLearningProgress';
import {dimensions} from '../../data/learning/skillDefinitions.mjs';
import {styles, When} from './LearningLayout';
function download(raw, filename) {
  if (raw === undefined || raw === null) throw new Error('Chưa có dữ liệu để xuất.');
  const blob = new Blob([raw], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function LearningSettings() {
  const {data, update, importBackup, exportBackup, legacy, readLegacy, archiveLegacy} =
    useLearningProgress();
  const [notice, setNotice] = useState('');
  const [importText, setImportText] = useState('');
  const readFile = async (event, archive = false) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > (archive ? 2_000_000 : 5_000_000))
        throw new Error('File vượt giới hạn dung lượng.');
      const raw = await file.text();
      if (archive) {
        if (archiveLegacy(raw))
          setNotice('Đã lưu nguyên JSON LevelUp trong archive. Chưa chuyển thành tiến độ bài học.');
      } else setImportText(raw);
    } catch (failure) {
      setNotice(failure.message);
    }
    event.target.value = '';
  };
  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <h2>Mục tiêu và rubric</h2>
        <form
          className={styles.stack}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const preferences = {
              weeklyMinutes: Number(form.get('weeklyMinutes')),
              weights: Object.fromEntries(
                Object.keys(dimensions).map((key) => [key, Number(form.get(key))]),
              ),
            };
            if (update((state) => ({...state, preferences})))
              setNotice('Đã lưu tùy chọn. Lịch sử giữ nguyên trọng số của từng lần đánh giá.');
          }}
        >
          <label>
            Mục tiêu mỗi tuần (phút)
            <input
              type="number"
              name="weeklyMinutes"
              min="15"
              max="10080"
              defaultValue={data.preferences.weeklyMinutes}
              required
            />
          </label>
          <fieldset>
            <legend>Trọng số rubric (tự chuẩn hóa thành 100%)</legend>
            <div className={styles.grid}>
              {Object.entries(dimensions).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    name={key}
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={data.preferences.weights[key]}
                    required
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <button className="button button--primary" type="submit">
            Lưu tùy chọn
          </button>
        </form>
      </section>
      <section className={styles.card}>
        <h2>Sao lưu và khôi phục</h2>
        <p>
          Chỉ lưu trong localStorage của website này, không đồng bộ thiết bị. Xuất JSON trước khi
          xóa dữ liệu trình duyệt hoặc chuyển máy.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            try {
              download(
                exportBackup(),
                `android-learning-${new Date().toISOString().slice(0, 10)}.json`,
              );
              setNotice('Đã tạo file backup.');
            } catch (failure) {
              setNotice(failure.message);
            }
          }}
        >
          Xuất JSON
        </button>
        <form
          className={`${styles.stack} margin-top--lg`}
          onSubmit={(event) => {
            event.preventDefault();
            if (importBackup(importText)) {
              setNotice(
                'Đã kiểm tra và gộp backup. Dữ liệu hiện tại được giữ khi trùng checklist, draft milestone hoặc tùy chọn.',
              );
              setImportText('');
            }
          }}
        >
          <label>
            Chọn backup Android Knowledge Hub (tối đa 5 MB)
            <input type="file" accept=".json,application/json" onChange={readFile} />
          </label>
          <label>
            Hoặc dán JSON backup
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              maxLength={5_000_000}
            />
          </label>
          <p className={styles.muted}>
            Import gộp history theo ID, từ chối ID xung đột và phiên bản chưa hỗ trợ. Nếu dữ liệu
            đang lưu bị hỏng, bản gốc được giữ ở recovery key trước khi khôi phục backup hợp lệ.
          </p>
          <button type="submit" className="button button--secondary" disabled={!importText.trim()}>
            Kiểm tra và nhập backup
          </button>
        </form>
      </section>
      <section className={styles.card}>
        <h2>Chuyển dữ liệu từ LevelUp HTML</h2>
        <p>
          localStorage tách theo origin. Dữ liệu trong HTML/file hoặc tên miền khác không tự xuất
          hiện tại vuphong0x.github.io.
        </p>
        <ol>
          <li>Mở bản LevelUp cũ tại đúng nơi đã dùng và xuất JSON bằng chức năng của bản đó.</li>
          <li>Giữ file gốc, rồi lưu trữ JSON bên dưới để đưa vào backup của Knowledge Hub.</li>
          <li>
            Chưa có HTML/schema LevelUp gốc để xác định ID và ý nghĩa điểm. Archive giữ nguyên nội
            dung; chưa tự chuyển checkbox/điểm cũ thành kỹ năng đạt.
          </li>
        </ol>
        {legacy && (
          <p className={styles.notice}>
            Tìm thấy key levelup-android-v1 ở cùng origin.{' '}
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                const raw = readLegacy();
                if (raw && archiveLegacy(raw))
                  setNotice('Đã lưu bản gốc LevelUp vào archive, key cũ không thay đổi.');
              }}
            >
              Lưu bản gốc vào archive
            </button>
          </p>
        )}
        <label>
          Lưu JSON LevelUp gốc (tối đa 2 MB)
          <input type="file" accept=".json,application/json" onChange={(e) => readFile(e, true)} />
        </label>
        <p>{data.legacyArchives.length} bản gốc đã lưu trữ.</p>
        {data.legacyArchives.map((archive) => (
          <div key={archive.id} className={styles.row}>
            <When at={archive.at} />
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => download(archive.raw, `levelup-original-${archive.id}.json`)}
            >
              Tải JSON gốc
            </button>
          </div>
        ))}
      </section>
      <p role="status">{notice}</p>
    </div>
  );
}
