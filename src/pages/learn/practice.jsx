import React from 'react';
import LearningLayout from '../../components/learning/LearningLayout';
import PracticeProjects from '../../components/learning/PracticeProjects';
export default function Page() {
  return (
    <LearningLayout title="Thực hành & capstone">
      <PracticeProjects />
    </LearningLayout>
  );
}
