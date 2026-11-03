import React from 'react';
import LearningLayout from '../../components/learning/LearningLayout';
import RoadmapView from '../../components/learning/RoadmapView';
export default function Page() {
  return (
    <LearningLayout title="Lộ trình 12 tháng">
      <RoadmapView />
    </LearningLayout>
  );
}
