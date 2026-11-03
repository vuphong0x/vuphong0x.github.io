import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {lessons, lessonById} from '../src/data/learning/roadmap.mjs';
import {milestones} from '../src/data/learning/projects.mjs';
import {ALL_QUESTIONS} from '../src/data/quizQuestions.mjs';
import {prepareSession, calculatePoints} from '../src/utils/quiz.mjs';
import {DEFAULT_WEIGHTS} from '../src/data/learning/skillDefinitions.mjs';
import {
  emptyProgress,
  parseBackup,
  validateData,
  mergeProgress,
  createProgressStorage,
  STORAGE_KEY,
} from '../src/services/learning/progressStorage.mjs';
import {
  scoreAssessment,
  recordAssessment,
  lessonStatus,
  summarizeProgress,
  isMastered,
} from '../src/services/learning/assessmentService.mjs';
import {DAY, scheduleReview, isDue} from '../src/services/learning/reviewScheduler.mjs';
import {
  questionsForLesson,
  skillsForQuestion,
  quizRecord,
} from '../src/services/learning/quizMapping.mjs';
const at = '2026-01-01T10:00:00.000Z';
const later = (days) => new Date(Date.parse(at) + days * DAY).toISOString();
const lesson = lessons[0];
const scores = {knowledge: 3, coding: 3, testing: 3, reasoning: 3};
const evidence = (id = 'e1', when = at, kind = 'independent') => ({
  id,
  at: when,
  kind,
  implementation: 'Commit implementing contract',
  url: 'https://example.com/commit',
  tests: 'npm test: 3 passing; failure injection included',
  reasoning: 'Sealed type distinguishes empty/offline.',
});
const started = () => ({
  startedAt: at,
  checklist: lesson.assessment.criteria.map(() => false),
  evidence: [],
  assessments: [],
  review: null,
});
function passedProgress() {
  const p = {
    ...started(),
    checklist: lesson.assessment.criteria.map(() => true),
    evidence: [evidence()],
  };
  return recordAssessment(p, lesson, {evidenceId: 'e1', scores, criteria: p.checklist}, at, 'a1');
}
function memory() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}
test('curriculum covers 12 months with complete content, real docs and acyclic prerequisites', () => {
  assert.equal(lessons.length, 24);
  assert.equal(new Set(lessons.map((l) => l.id)).size, lessons.length);
  assert.deepEqual(
    [...new Set(lessons.map((l) => l.month))],
    Array.from({length: 12}, (_, i) => i + 1),
  );
  const visited = new Set();
  for (const l of lessons) {
    assert.equal(l.phase, Math.ceil(l.month / 3));
    assert.ok(l.objectives.length >= 2 && l.theory.length >= 2 && l.examples[0].code);
    assert.equal(l.exercises.length, 2);
    assert.ok(
      l.exercises[0].context &&
        l.exercises[0].steps.length >= 3 &&
        l.exercises[0].verification &&
        l.exercises[0].constraints,
    );
    assert.ok(
      l.exercises.every((e) => e.expected) &&
        l.assessment.criteria.length >= 3 &&
        l.assessment.followUp &&
        l.reviewQuestions.length >= 2,
    );
    for (const id of l.prerequisites)
      assert.ok(visited.has(id), `Unresolved/cyclic prerequisite ${id}`);
    for (const route of l.relatedDocs)
      assert.ok(existsSync(new URL(`../docs${route}.md`, import.meta.url)), route);
    l.resources.forEach((r) => assert.match(r.url, /^https:\/\//));
    visited.add(l.id);
  }
  assert.equal(milestones.length, 8);
  for (const m of milestones) {
    assert.ok(m.deliverables.length && m.requirements && m.criteria.length);
    m.lessons.forEach((id) => assert.ok(lessonById[id]));
  }
});
test('weighted scoring validates inputs and keeps configurable weights', () => {
  assert.equal(scoreAssessment(scores), 75);
  assert.equal(scoreAssessment({knowledge: 4, coding: 0, testing: 0, reasoning: 0}), 20);
  assert.equal(
    scoreAssessment(
      {knowledge: 4, coding: 0, testing: 0, reasoning: 0},
      {knowledge: 4, coding: 1, testing: 1, reasoning: 2},
    ),
    50,
  );
  assert.throws(() => scoreAssessment({...scores, coding: 5}));
  assert.throws(() => scoreAssessment({...scores, coding: NaN}));
  assert.throws(() => scoreAssessment(scores, {...DEFAULT_WEIGHTS, coding: -1}));
  assert.throws(() =>
    scoreAssessment(scores, {knowledge: 1e308, coding: 1e308, testing: 1e308, reasoning: 1e308}),
  );
});
test('reading, checklists and quiz alone never certify completion', () => {
  assert.equal(lessonStatus(undefined, lesson), 'not-started');
  const p = {...started(), checklist: lesson.assessment.criteria.map(() => true)};
  assert.equal(lessonStatus(p, lesson), 'learning');
  assert.equal(summarizeProgress([lesson], {[lesson.id]: p}).completed, 0);
  p.evidence.push(evidence());
  assert.equal(lessonStatus(p, lesson), 'submitted');
  assert.throws(() =>
    recordAssessment(started(), lesson, {evidenceId: 'missing', scores, criteria: []}, at, 'a'),
  );
});
test('pass requires evidence, tests, reasoning, every criterion and minimum per-dimension score', () => {
  const p = passedProgress();
  assert.equal(lessonStatus(p, lesson, Date.parse(at)), 'passed');
  assert.equal(summarizeProgress([lesson], {[lesson.id]: p}, Date.parse(at)).percent, 100);
  const attempt = p.assessments[0];
  for (const change of [{checklist: []}, {scores: {...scores, testing: 2}}]) {
    const altered = recordAssessment(
      {...p, assessments: [], review: null},
      lesson,
      {
        evidenceId: 'e1',
        scores: change.scores || scores,
        criteria: change.checklist || p.checklist,
      },
      at,
      'a2',
    );
    assert.equal(lessonStatus(altered, lesson, Date.parse(at)), 'needs-review');
  }
  const noTests = {...p, evidence: [{...evidence(), tests: ''}]};
  assert.equal(lessonStatus(noTests, lesson, Date.parse(at)), 'needs-review');
  assert.deepEqual(attempt.weights, DEFAULT_WEIGHTS);
});
test('mastery requires new follow-up evidence after 24 hours and a prior pass', () => {
  const p = passedProgress();
  const input = {evidenceId: 'e2', scores, criteria: p.checklist, followUp: true};
  const next = {...p, evidence: [...p.evidence, evidence('e2', later(1), 'follow-up')]};
  assert.throws(() =>
    recordAssessment(
      {...p, evidence: [...p.evidence, evidence('e2', later(0.5), 'follow-up')]},
      lesson,
      input,
      later(0.5),
      'a2',
    ),
  );
  assert.throws(() => recordAssessment(p, lesson, {...input, evidenceId: 'e1'}, later(1), 'a2'));
  assert.throws(() =>
    recordAssessment(
      {...p, evidence: [...p.evidence, evidence('e2', at, 'follow-up')]},
      lesson,
      input,
      later(1),
      'a2',
    ),
  );
  const mastered = recordAssessment(next, lesson, input, later(1), 'a2');
  assert.ok(isMastered(mastered, lesson.assessment.criteria.length));
  assert.equal(lessonStatus(mastered, lesson, Date.parse(later(1))), 'mastered');
  assert.equal(lessonStatus(mastered, lesson, Date.parse(later(9))), 'needs-review');
});
test('review schedule is deterministic: 1, 7, 30 days, failure resets to 1', () => {
  const r1 = scheduleReview(null, true, at);
  assert.equal(r1.dueAt, later(1));
  const r2 = scheduleReview(r1, true, r1.dueAt);
  assert.equal(r2.dueAt, later(8));
  const r3 = scheduleReview(r2, true, r2.dueAt);
  assert.equal(r3.dueAt, later(38));
  assert.equal(scheduleReview(r3, false, later(38)).dueAt, later(39));
  assert.equal(scheduleReview(r3, true, later(38)).step, 2);
  assert.equal(isDue(r1, Date.parse(later(1)) - 1), false);
  assert.equal(isDue(r1, Date.parse(later(1))), true);
  assert.throws(() => scheduleReview(null, true, 'invalid'));
});
test('JSON import rejects malformed, unsafe, unknown and oversized data', () => {
  assert.throws(() => parseBackup('{oops'));
  assert.throws(() => parseBackup('{"__proto__":{"polluted":true}}'));
  assert.throws(() => parseBackup(' '.repeat(5_000_001)));
  for (const change of [
    {schemaVersion: 99},
    {lessons: {unknown: {}}},
    {quizzes: {}},
    {preferences: {weeklyMinutes: -1, weights: DEFAULT_WEIGHTS}},
  ]) {
    assert.throws(() => validateData({...emptyProgress(), ...change}));
  }
  assert.deepEqual(parseBackup(JSON.stringify(emptyProgress())), emptyProgress());
  const data = emptyProgress();
  data.lessons[lesson.id] = passedProgress();
  assert.deepEqual(parseBackup(JSON.stringify(data)), data);
  data.lessons[lesson.id].review.dueAt = later(999);
  assert.throws(() => validateData(data));
});
test('invalid evidence URLs and fake milestone completion are rejected', () => {
  const data = emptyProgress();
  data.lessons[lesson.id] = {...started(), evidence: [{...evidence(), url: 'javascript:alert(1)'}]};
  assert.throws(() => validateData(data));
  const project = {notes: '', evidence: '', criteria: [true, true], completed: true, updatedAt: at};
  assert.throws(() => validateData({...emptyProgress(), projects: {requirements: project}}));
});
test('schema 1 migration preserves progress and is idempotent without assuming LevelUp IDs', () => {
  const old = {...emptyProgress(), schemaVersion: 1};
  delete old.legacyArchives;
  delete old.preferences;
  old.lessons[lesson.id] = passedProgress();
  const migrated = validateData(old);
  assert.equal(migrated.schemaVersion, 2);
  assert.deepEqual(migrated.lessons, old.lessons);
  assert.deepEqual(validateData(migrated), migrated);
  assert.throws(() => validateData({completed: ['levelup-1']}));
});
test('imports merge history while preserving current drafts and rejecting conflicting IDs', () => {
  const current = emptyProgress(),
    incoming = emptyProgress();
  current.lessons[lesson.id] = passedProgress();
  incoming.lessons[lesson.id] = {...started(), evidence: [evidence('e2')]};
  incoming.preferences.weeklyMinutes = 600;
  const merged = mergeProgress(current, incoming);
  assert.equal(merged.lessons[lesson.id].evidence.length, 2);
  assert.equal(merged.lessons[lesson.id].assessments.length, 1);
  assert.deepEqual(merged.lessons[lesson.id].checklist, current.lessons[lesson.id].checklist);
  assert.equal(merged.preferences.weeklyMinutes, 180);
  assert.deepEqual(mergeProgress(merged, incoming), merged);
  const reordered = structuredClone(current);
  reordered.lessons[lesson.id].evidence[0] = Object.fromEntries(
    Object.entries(reordered.lessons[lesson.id].evidence[0]).reverse(),
  );
  reordered.lessons[lesson.id].review = Object.fromEntries(
    Object.entries(reordered.lessons[lesson.id].review).reverse(),
  );
  assert.doesNotThrow(() => mergeProgress(current, reordered));
  incoming.lessons[lesson.id].evidence[0] = {...evidence(), implementation: 'Conflicting edit'};
  assert.throws(() => mergeProgress(current, incoming));
});
test('malformed stored data is not overwritten and explicit restore preserves original recovery data', () => {
  const mem = memory();
  mem.setItem(STORAGE_KEY, '{broken');
  const storage = createProgressStorage(mem);
  assert.ok(storage.read().error);
  assert.throws(() => storage.update(() => emptyProgress()));
  assert.equal(mem.getItem(STORAGE_KEY), '{broken');
  assert.equal(storage.exportBackup(), '{broken');
  storage.importBackup(JSON.stringify(emptyProgress()));
  assert.equal(storage.read().error, null);
  assert.ok(
    [...mem.values.entries()].some(
      ([key, value]) => key.startsWith(`${STORAGE_KEY}-recovery-`) && value === '{broken',
    ),
  );
});
test('failed writes surface errors; independent updates read latest data', () => {
  const blocked = createProgressStorage({
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
  });
  assert.throws(() => blocked.update(() => emptyProgress()), /Quota/);
  const mem = memory(),
    a = createProgressStorage(mem),
    b = createProgressStorage(mem);
  a.update((s) => ({...s, preferences: {...s.preferences, weeklyMinutes: 240}}));
  b.update((s) => ({...s, lessons: {[lesson.id]: started()}}));
  assert.equal(a.read().data.preferences.weeklyMinutes, 240);
  assert.ok(a.read().data.lessons[lesson.id]);
});
test('LevelUp archival keeps exact JSON and does not award progress', () => {
  const data = emptyProgress(),
    raw = '{ "unknownLessonIds": [1, 2], "done": true }';
  data.legacyArchives.push({id: 'legacy1', at, source: 'levelup-android-v1', raw});
  const restored = parseBackup(JSON.stringify(data));
  assert.equal(restored.legacyArchives[0].raw, raw);
  assert.equal(summarizeProgress(lessons, restored.lessons).completed, 0);
});
test('quiz mapping intersects explicit topic and actual documentation route', () => {
  for (const l of lessons)
    for (const q of questionsForLesson(l.id)) {
      assert.ok(l.quizTopics.includes(q.topic));
      assert.ok(l.relatedDocs.includes(q.docLink.split('#')[0]));
      assert.ok(skillsForQuestion(q.id).includes(l.id));
    }
  assert.ok(questionsForLesson('kotlin-structured-concurrency').length > 0);
  assert.deepEqual(questionsForLesson('llm-contracts'), []);
  assert.deepEqual(skillsForQuestion(-1), []);
});
test('quiz history stores original answer identities and preserves scoring, including timed bonuses', () => {
  const session = prepareSession(ALL_QUESTIONS, 3, () => 0.5);
  const answers = session.map((q, i) => ({
    question: q,
    selectedIdx: i ? q.correctOptionIdx : -1,
    isCorrect: Boolean(i),
    ...calculatePoints(Boolean(i), 10, q.duration, 3, true),
  }));
  const record = quizRecord(answers, {id: 'q1', at, mode: 'challenge'});
  assert.equal(record.answers[0].selectedOriginal, -1);
  assert.equal(record.answers[1].selectedOriginal, session[1].correct);
  const data = {...emptyProgress(), quizzes: [record]};
  assert.deepEqual(validateData(data), data);
  assert.equal(summarizeProgress(lessons, data.lessons).completed, 0);
  record.answers[1].correct = false;
  assert.throws(() => validateData(data));
});
