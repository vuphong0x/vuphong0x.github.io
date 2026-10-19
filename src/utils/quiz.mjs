export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function filterQuestions(questions, topic = 'all', level = 'all') {
  return questions.filter(q => (topic === 'all' || q.topic === topic)
    && (level === 'all' || q.level === level));
}

export function prepareSession(pool, count, random = Math.random) {
  return shuffle(pool, random).slice(0, count).map(question => {
    const shuffledOptions = shuffle(question.options.map((text, originalIdx) => ({text, originalIdx})), random);
    return {
      ...question,
      shuffledOptions,
      correctOptionIdx: shuffledOptions.findIndex(option => option.originalIdx === question.correct),
      duration: question.level === 'senior' ? 60 : 20,
    };
  });
}

export function calculatePoints(isCorrect, timeLeft, duration, streak, timed) {
  if (!isCorrect) return {points: 0, bonus: 0};
  const base = !timed || timeLeft / duration > 0.75 ? 10 : timeLeft / duration > 0.5 ? 7 : 5;
  const bonus = timed && streak % 3 === 0 ? 5 : 0;
  return {points: base + bonus, bonus};
}

export function accuracy(answers) {
  return answers.length ? Math.round(100 * answers.filter(a => a.isCorrect).length / answers.length) : 0;
}
