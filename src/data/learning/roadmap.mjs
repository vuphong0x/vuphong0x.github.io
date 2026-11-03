import foundation from './foundation.mjs';
import engineering from './engineering.mjs';
import ai from './ai.mjs';
import career from './career.mjs';
export const lessons = [...foundation, ...engineering, ...ai, ...career];
export const lessonById = Object.fromEntries(lessons.map((item) => [item.id, item]));
export const phases = [
  {id: 1, title: 'Android Senior Foundation', months: '1–3'},
  {id: 2, title: 'Architecture & Engineering', months: '4–6'},
  {id: 3, title: 'AI & Backend Engineering', months: '7–9'},
  {id: 4, title: 'Senior Career Preparation', months: '10–12'},
];
export const lessonPath = (id) => `/learn/lesson/${id}`;
