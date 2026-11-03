import React from 'react';
import LearningLayout from '../../components/learning/LearningLayout';
import LearningJournal from '../../components/learning/LearningJournal';
export default function Page() {
  return (
    <LearningLayout title="Nhật ký học tập">
      <LearningJournal />
    </LearningLayout>
  );
}
