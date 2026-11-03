import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {LearningProvider, useLearningProgress} from '../../hooks/useLearningProgress';
import {STATUS_LABELS} from '../../data/learning/skillDefinitions.mjs';
import styles from './learning.module.css';
export {styles};
const nav = [
  ['/learn', 'Tổng quan'],
  ['/learn/roadmap', 'Lộ trình'],
  ['/learn/practice', 'Thực hành'],
  ['/learn/skills', 'Kỹ năng'],
  ['/learn/journal', 'Nhật ký'],
  ['/learn/settings', 'Dữ liệu & tùy chọn'],
];
export function Status({value}) {
  return (
    <span className={styles.status} data-state={value}>
      {STATUS_LABELS[value]}
    </span>
  );
}
export function When({at}) {
  return <time dateTime={at}>{new Date(at).toLocaleString('vi-VN')}</time>;
}
function Content({title, children, renderBeforeReady}) {
  const {ready, error} = useLearningProgress();
  return (
    <main className={`container ${styles.root}`}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>ANDROID KNOWLEDGE HUB / HỌC TẬP</span>
        <h1>{title}</h1>
      </div>
      <nav aria-label="Điều hướng học tập" className={styles.nav}>
        {nav.map(([to, label]) => (
          <Link key={to} to={to} isNavLink exact activeClassName={styles.active}>
            {label}
          </Link>
        ))}
      </nav>
      {error && (
        <div className="alert alert--danger" role="alert">
          {error} <Link to="/learn/settings">Sao lưu / khôi phục dữ liệu</Link>
        </div>
      )}
      {!ready && <p role="status">Đang tải tiến độ trên trình duyệt…</p>}
      {(ready || renderBeforeReady) && children}
    </main>
  );
}
export default function LearningLayout({title, children, renderBeforeReady = false}) {
  return (
    <Layout
      title={title}
      description="Lộ trình Android 12 tháng, bài thực hành, đánh giá theo bằng chứng và lịch ôn tập."
    >
      <LearningProvider>
        <Content title={title} renderBeforeReady={renderBeforeReady}>
          {children}
        </Content>
      </LearningProvider>
    </Layout>
  );
}
