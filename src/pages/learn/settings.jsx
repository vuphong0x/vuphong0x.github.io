import React from 'react';
import LearningLayout from '../../components/learning/LearningLayout';
import LearningSettings from '../../components/learning/LearningSettings';
export default function Page() {
  return (
    <LearningLayout title="Dữ liệu & tùy chọn">
      <LearningSettings />
    </LearningLayout>
  );
}
