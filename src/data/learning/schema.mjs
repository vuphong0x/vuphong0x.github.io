// New curriculum, authored for this integration. No LevelUp source was supplied.
export function lesson(data) {
  return {
    difficulty: 'advanced',
    estimatedMinutes: 150,
    resources: [],
    prerequisites: [],
    ...data,
    examples: [{language: 'kotlin', code: data.code, explanation: data.behavior}],
    exercises: [
      {
        kind: 'guided',
        title: data.practice,
        context: data.context,
        steps: data.steps,
        constraints: data.constraints,
        expected: data.expected,
        verification: data.verification,
      },
      {kind: 'independent', title: data.challenge, expected: data.challengeExpected},
    ],
    assessment: {
      criteria: data.criteria,
      followUp: data.followUp,
      evidence:
        'Ghi commit/PR hoặc artifact, kết quả test kèm lệnh và môi trường, và giải thích quyết định. Nội dung do người học tự báo cáo.',
    },
  };
}
