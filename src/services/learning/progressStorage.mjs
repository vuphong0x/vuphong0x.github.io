import {lessonById} from '../../data/learning/roadmap.mjs';
import {milestones} from '../../data/learning/projects.mjs';
import {DEFAULT_WEIGHTS} from '../../data/learning/skillDefinitions.mjs';
import {recordAssessment, scoreAssessment} from './assessmentService.mjs';
import {questionById} from './quizMapping.mjs';
export const STORAGE_KEY = 'android-knowledge-learning-v1';
export const LEGACY_KEY = 'levelup-android-v1';
export const SCHEMA_VERSION = 2;
const MAX_BYTES = 5_000_000;
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (message) => {
  throw new Error(message);
};
const expect = (condition, message) => {
  if (!condition) fail(message);
};
const string = (v, max = 20000) => typeof v === 'string' && v.length <= max;
const date = (v) => string(v, 40) && Number.isFinite(Date.parse(v));
const timestamp = (v) => date(v) && new Date(v).toISOString() === v;
const id = (v) => string(v, 150) && /^[a-zA-Z0-9_-]+$/.test(v);
const url = (value) =>
  !value ||
  (/^https?:\/\//.test(value) &&
    (() => {
      try {
        return Boolean(new URL(value).hostname);
      } catch {
        return false;
      }
    })());
function safeTree(value, depth = 0) {
  expect(depth < 30, 'JSON lồng quá sâu.');
  if (value && typeof value === 'object')
    for (const key of Object.keys(value)) {
      expect(!unsafeKeys.has(key), 'JSON có khóa không an toàn.');
      safeTree(value[key], depth + 1);
    }
}
function list(value, label, check) {
  expect(
    Array.isArray(value) && value.length <= 10000,
    `${label}: danh sách không hợp lệ hoặc quá dài.`,
  );
  const seen = new Set();
  value.forEach((item) => {
    expect(object(item) && id(item.id) && !seen.has(item.id), `${label}: ID thiếu hoặc trùng.`);
    seen.add(item.id);
    check(item);
  });
}
function keys(value, allowed, label) {
  expect(
    object(value) && Object.keys(value).every((key) => allowed.includes(key)),
    `${label}: trường không được hỗ trợ.`,
  );
}
export function emptyProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    lessons: {},
    projects: {},
    journal: [],
    quizzes: [],
    preferences: {weeklyMinutes: 180, weights: {...DEFAULT_WEIGHTS}},
    legacyArchives: [],
  };
}
export function migrateData(input) {
  // Schema 1 is the documented pre-release AKH format, not an assumed LevelUp format.
  if (input?.schemaVersion === 1)
    return {
      ...input,
      schemaVersion: SCHEMA_VERSION,
      preferences: {weeklyMinutes: 180, weights: {...DEFAULT_WEIGHTS}, ...input.preferences},
      legacyArchives: input.legacyArchives || [],
    };
  expect(
    input?.schemaVersion === SCHEMA_VERSION,
    'Không nhận diện phiên bản backup. JSON LevelUp gốc cần dùng mục lưu trữ riêng; phiên bản tương lai không được ghi đè.',
  );
  return input;
}
export function validateData(input) {
  safeTree(input);
  const data = migrateData(input);
  keys(
    data,
    ['schemaVersion', 'lessons', 'projects', 'journal', 'quizzes', 'preferences', 'legacyArchives'],
    'Backup',
  );
  expect(object(data.lessons) && object(data.projects), 'Thiếu progress bài học/dự án.');
  for (const [lessonId, p] of Object.entries(data.lessons)) {
    const lesson = lessonById[lessonId];
    expect(Boolean(lesson), `Bài học chưa biết: ${lessonId}. Không tự bỏ dữ liệu.`);
    keys(p, ['startedAt', 'checklist', 'evidence', 'assessments', 'review'], 'Progress');
    expect(
      timestamp(p.startedAt) &&
        Array.isArray(p.checklist) &&
        p.checklist.length === lesson.assessment.criteria.length &&
        p.checklist.every((v) => typeof v === 'boolean'),
      'Ngày bắt đầu hoặc checklist không hợp lệ.',
    );
    list(p.evidence, 'Bằng chứng', (e) => {
      keys(e, ['id', 'at', 'kind', 'implementation', 'url', 'tests', 'reasoning'], 'Bằng chứng');
      expect(
        timestamp(e.at) &&
          ['guided', 'independent', 'follow-up'].includes(e.kind) &&
          [e.implementation, e.tests, e.reasoning].every((v) => string(v)) &&
          e.implementation.trim() &&
          string(e.url, 2000) &&
          url(e.url),
        'Bằng chứng thiếu nội dung hoặc URL http(s) không hợp lệ.',
      );
    });
    let replay = {...p, assessments: [], review: null};
    list(p.assessments, 'Đánh giá', (a) => {
      keys(
        a,
        ['id', 'at', 'evidenceId', 'scores', 'weights', 'criteria', 'followUp', 'source'],
        'Đánh giá',
      );
      expect(
        timestamp(a.at) &&
          a.source === 'self-reported' &&
          typeof a.followUp === 'boolean' &&
          Array.isArray(a.criteria) &&
          a.criteria.length === lesson.assessment.criteria.length &&
          a.criteria.every((v) => typeof v === 'boolean'),
        'Đánh giá/rubric không hợp lệ.',
      );
      keys(a.scores, Object.keys(DEFAULT_WEIGHTS), 'Điểm');
      keys(a.weights, Object.keys(DEFAULT_WEIGHTS), 'Trọng số');
      scoreAssessment(a.scores, a.weights);
      expect(
        !replay.assessments.length || Date.parse(a.at) >= Date.parse(replay.assessments.at(-1).at),
        'Lịch sử đánh giá phải theo thời gian.',
      );
      replay = recordAssessment(replay, lesson, a, a.at, a.id);
    });
    expect(
      replay.review
        ? object(p.review) &&
            Object.keys(p.review).length === 4 &&
            ['step', 'lastAt', 'dueAt', 'passed'].every(
              (key) => p.review[key] === replay.review[key],
            )
        : p.review === null || p.review === undefined,
      'Lịch ôn tập không khớp lịch sử đánh giá.',
    );
  }
  for (const [projectId, p] of Object.entries(data.projects)) {
    const project = milestones.find((item) => item.id === projectId);
    expect(Boolean(project), `Milestone chưa biết: ${projectId}`);
    keys(p, ['notes', 'evidence', 'criteria', 'completed', 'updatedAt'], 'Milestone');
    expect(
      string(p.notes) &&
        string(p.evidence, 2000) &&
        url(p.evidence) &&
        timestamp(p.updatedAt) &&
        Array.isArray(p.criteria) &&
        p.criteria.length === project.criteria.length &&
        p.criteria.every((v) => typeof v === 'boolean') &&
        typeof p.completed === 'boolean',
      'Milestone không hợp lệ.',
    );
    expect(
      !p.completed || (p.evidence && p.criteria.every(Boolean)),
      'Milestone hoàn tất cần URL bằng chứng và tất cả tiêu chí.',
    );
  }
  list(data.journal, 'Nhật ký', (entry) => {
    keys(
      entry,
      ['id', 'at', 'date', 'lessonId', 'minutes', 'learned', 'problems', 'solutions', 'next'],
      'Nhật ký',
    );
    expect(
      timestamp(entry.at) &&
        /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
        date(entry.date) &&
        new Date(entry.date).toISOString().slice(0, 10) === entry.date &&
        (entry.lessonId === '' || Boolean(lessonById[entry.lessonId])) &&
        Number.isInteger(entry.minutes) &&
        entry.minutes > 0 &&
        entry.minutes <= 1440 &&
        [entry.learned, entry.problems, entry.solutions, entry.next].every((v) => string(v)) &&
        entry.learned.trim(),
      'Nhật ký thiếu ngày/nội dung hoặc thời lượng 1–1440 phút.',
    );
  });
  list(data.quizzes, 'Quiz', (q) => {
    keys(q, ['id', 'at', 'mode', 'lessonId', 'answers', 'score'], 'Quiz');
    expect(
      timestamp(q.at) &&
        ['practice', 'challenge'].includes(q.mode) &&
        (q.lessonId === null || Boolean(lessonById[q.lessonId])) &&
        Array.isArray(q.answers) &&
        q.answers.length > 0 &&
        q.answers.length <= 130,
      'Phiên quiz không hợp lệ.',
    );
    const seen = new Set();
    q.answers.forEach((a) => {
      keys(a, ['questionId', 'correct', 'selectedOriginal', 'points'], 'Câu trả lời');
      const question = questionById(a.questionId);
      expect(
        question &&
          !seen.has(a.questionId) &&
          typeof a.correct === 'boolean' &&
          Number.isInteger(a.selectedOriginal) &&
          a.selectedOriginal >= -1 &&
          a.selectedOriginal <= 3 &&
          a.correct === (a.selectedOriginal === question.correct) &&
          [0, 5, 7, 10, 12, 15].includes(a.points) &&
          (a.correct ? a.points > 0 : a.points === 0),
        'Câu trả lời quiz không hợp lệ.',
      );
      seen.add(a.questionId);
    });
    expect(
      q.score === q.answers.reduce((sum, a) => sum + a.points, 0),
      'Tổng điểm quiz không khớp.',
    );
  });
  keys(data.preferences, ['weeklyMinutes', 'weights'], 'Tùy chọn');
  expect(
    Number.isInteger(data.preferences.weeklyMinutes) &&
      data.preferences.weeklyMinutes >= 15 &&
      data.preferences.weeklyMinutes <= 10080,
    'Mục tiêu tuần: 15–10080 phút.',
  );
  keys(data.preferences.weights, Object.keys(DEFAULT_WEIGHTS), 'Trọng số');
  scoreAssessment({knowledge: 0, coding: 0, testing: 0, reasoning: 0}, data.preferences.weights);
  list(data.legacyArchives, 'LevelUp archive', (archive) => {
    keys(archive, ['id', 'at', 'source', 'raw'], 'LevelUp archive');
    expect(
      timestamp(archive.at) && archive.source === LEGACY_KEY && string(archive.raw, 2_000_000),
      'Archive không hợp lệ.',
    );
    JSON.parse(archive.raw);
  });
  return JSON.parse(JSON.stringify(data));
}
export function parseBackup(raw) {
  expect(
    typeof raw === 'string' && new TextEncoder().encode(raw).length <= MAX_BYTES,
    'Backup tối đa 5 MB.',
  );
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('Không đọc được JSON. Dữ liệu hiện tại được giữ nguyên.');
  }
  return validateData(value);
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
function union(a, b) {
  const result = new Map(a.map((item) => [item.id, item]));
  for (const item of b) {
    const existing = result.get(item.id);
    expect(
      !existing || JSON.stringify(canonical(existing)) === JSON.stringify(canonical(item)),
      `Xung đột ID ${item.id}; không ghi đè dữ liệu. Hãy giữ hai backup để đối chiếu.`,
    );
    result.set(item.id, item);
  }
  return [...result.values()].sort((a, b) => a.at.localeCompare(b.at));
}
export function mergeProgress(current, imported) {
  current = validateData(current);
  imported = validateData(imported);
  const result = JSON.parse(JSON.stringify(current));
  for (const [key, incoming] of Object.entries(imported.lessons)) {
    if (!result.lessons[key]) {
      result.lessons[key] = incoming;
      continue;
    }
    const existing = result.lessons[key];
    const evidence = union(existing.evidence, incoming.evidence);
    const attempts = union(existing.assessments, incoming.assessments);
    let merged = {...existing, evidence, assessments: [], review: null};
    for (const a of attempts) merged = recordAssessment(merged, lessonById[key], a, a.at, a.id);
    result.lessons[key] = merged;
  }
  // On conflict current checklist, project drafts and preferences win. Histories merge by ID.
  result.projects = {...imported.projects, ...current.projects};
  for (const field of ['journal', 'quizzes', 'legacyArchives'])
    result[field] = union(current[field], imported[field]);
  return validateData(result);
}
// Adapter methods are synchronous today. UI depends on this interface, not localStorage.
export function createProgressStorage(storage) {
  const read = () => {
    let raw = null;
    try {
      raw = storage.getItem(STORAGE_KEY);
      return {data: raw === null ? emptyProgress() : parseBackup(raw), error: null, raw};
    } catch (error) {
      return {
        data: emptyProgress(),
        error: `Không tải được tiến độ: ${error.message} Không ghi đè dữ liệu gốc.`,
        raw,
      };
    }
  };
  const save = (data) => {
    const serialized = JSON.stringify(validateData(data));
    expect(
      new TextEncoder().encode(serialized).length <= MAX_BYTES,
      'Tiến độ vượt 5 MB. Hãy xuất backup.',
    );
    storage.setItem(STORAGE_KEY, serialized);
    return data;
  };
  return {
    read,
    update(updater) {
      const current = read();
      if (current.error) fail(current.error);
      return save(updater(current.data));
    },
    importBackup(raw) {
      const incoming = parseBackup(raw);
      const current = read();
      if (current.error) {
        expect(current.raw !== null, 'Storage chưa truy cập được; không thể import.');
        // Preserve malformed data before an explicit restore. Failure to backup aborts restore.
        storage.setItem(`${STORAGE_KEY}-recovery-${Date.now()}`, current.raw);
        return save(incoming);
      }
      return save(mergeProgress(current.data, incoming));
    },
    exportBackup() {
      const current = read();
      return current.error ? current.raw : JSON.stringify(current.data, null, 2);
    },
    legacyRaw() {
      return storage.getItem(LEGACY_KEY);
    },
  };
}
