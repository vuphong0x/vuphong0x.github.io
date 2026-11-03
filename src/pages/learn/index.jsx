import React from 'react';
import LearningLayout from '../../components/learning/LearningLayout';
import LearningDashboard from '../../components/learning/LearningDashboard';
export default function Page() {
  return (
    <LearningLayout title="Tổng quan học tập">
      <LearningDashboard />
    </LearningLayout>
  );
}
