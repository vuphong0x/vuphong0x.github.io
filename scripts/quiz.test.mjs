import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {ALL_QUESTIONS, TOPICS} from '../src/data/quizQuestions.mjs';
import {shuffle, filterQuestions, prepareSession, calculatePoints, accuracy} from '../src/utils/quiz.mjs';

const root = new URL('../', import.meta.url);

test('every question has a unique ID, valid answer and resolvable study link', () => {
  assert.equal(new Set(ALL_QUESTIONS.map(q => q.id)).size, ALL_QUESTIONS.length);
  const topics = new Set(TOPICS.filter(topic => topic.id !== 'all').map(topic => topic.id));
  for (const q of ALL_QUESTIONS) {
    assert.ok(q.question && q.explanation && q.topicLabel, `Incomplete question ${q.id}`);
    assert.ok(topics.has(q.topic), `Unknown topic ${q.id}`);
    assert.ok(['core', 'senior'].includes(q.level));
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4, `Duplicate option ${q.id}`);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length);
    const [route, anchor] = q.docLink.split('#');
    const doc = new URL(`docs${route}.md`, root);
    assert.ok(existsSync(doc), `Missing study doc ${q.id}: ${route}`);
    if (anchor) assert.ok(readFileSync(doc, 'utf8').includes(`{#${anchor}}`), `Missing anchor ${q.id}: ${anchor}`);
  }
});

test('filters intersect correctly and empty topic/level combinations remain empty', () => {
  const seniors = filterQuestions(ALL_QUESTIONS, 'all', 'senior');
  assert.equal(seniors.length, 30);
  assert.equal(filterQuestions(ALL_QUESTIONS, 'all', 'core').length, 100);
  assert.ok(filterQuestions(ALL_QUESTIONS, 'activity', 'senior').every(q => q.topic === 'activity' && q.level === 'senior'));
  assert.deepEqual(filterQuestions(ALL_QUESTIONS, 'testing', 'core'), []);
});

test('sessions preserve correct answer after question and option randomization', () => {
  const snapshot = JSON.stringify(ALL_QUESTIONS);
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const session = prepareSession(ALL_QUESTIONS, 15, random);
    assert.equal(session.length, 15);
    assert.equal(new Set(session.map(q => q.id)).size, session.length);
    for (const q of session) {
      assert.equal(q.shuffledOptions[q.correctOptionIdx].text, q.options[q.correct]);
      assert.equal(q.duration, q.level === 'senior' ? 60 : 20);
    }
  }
  assert.equal(JSON.stringify(ALL_QUESTIONS), snapshot);
  assert.deepEqual(shuffle([], () => 0), []);
});

test('short pools and retry sessions include each available question once', () => {
  const small = ALL_QUESTIONS.slice(0, 3);
  const prepared = prepareSession(small, 15);
  assert.equal(prepared.length, 3);
  const retry = prepareSession([prepared[0], prepared[2]], 2);
  assert.deepEqual(new Set(retry.map(q => q.id)), new Set([prepared[0].id, prepared[2].id]));
  for (const q of retry) assert.equal(q.shuffledOptions[q.correctOptionIdx].text, q.options[q.correct]);
  assert.deepEqual(prepareSession([], 15), []);
});

test('accuracy uses correct answers, stays within 0–100 and ignores bonus points', () => {
  assert.equal(accuracy([]), 0);
  assert.equal(accuracy([{isCorrect: true, points: 15}, {isCorrect: true, points: 15}]), 100);
  assert.equal(accuracy([{isCorrect: false, points: 0}, {isCorrect: true, points: 15}]), 50);
  assert.equal(accuracy([{isCorrect: true}, {isCorrect: true}, {isCorrect: false}]), 67);
});

test('timed scoring scales with duration; practice and timeout scores are consistent', () => {
  assert.deepEqual(calculatePoints(false, 0, 60, 0, true), {points: 0, bonus: 0});
  assert.deepEqual(calculatePoints(true, 1, 60, 3, false), {points: 10, bonus: 0});
  assert.deepEqual(calculatePoints(true, 50, 60, 3, true), {points: 15, bonus: 5});
  assert.deepEqual(calculatePoints(true, 40, 60, 1, true), {points: 7, bonus: 0});
  assert.deepEqual(calculatePoints(true, 15, 20, 1, true), {points: 7, bonus: 0});
  assert.deepEqual(calculatePoints(true, 10, 20, 1, true), {points: 5, bonus: 0});
});
