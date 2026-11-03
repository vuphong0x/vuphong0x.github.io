import React from 'react';
import LearningLayout from '../../components/learning/LearningLayout';
import SkillMatrix from '../../components/learning/SkillMatrix';
export default function Page() {
  return (
    <LearningLayout title="Đánh giá kỹ năng">
      <SkillMatrix />
    </LearningLayout>
  );
}
