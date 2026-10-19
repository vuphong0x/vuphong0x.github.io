import coreQuestions from './coreQuestions.mjs';
import seniorQuestions from './seniorQuestions.mjs';

export const ALL_QUESTIONS = [...coreQuestions, ...seniorQuestions];
export const TOPICS = [
  { id: 'all', label: '🎯 Tất cả', color: '#1b9c5a' },
  { id: 'activity', label: '📱 Activity & Fragment', color: '#2196F3' },
  { id: 'coroutines', label: '⚡ Coroutines', color: '#9C27B0' },
  { id: 'architecture', label: '🏗️ Architecture', color: '#FF9800' },
  { id: 'performance', label: '🚀 Performance', color: '#F44336' },
  { id: 'general', label: '🤖 General Android', color: '#607D8B' },
  { id: 'compose', label: '🎨 Jetpack Compose', color: '#008577' },
  { id: 'data', label: '💾 Data & Offline', color: '#795548' },
  { id: 'security', label: '🔐 Security & Privacy', color: '#5C6BC0' },
  { id: 'testing', label: '🧪 Testing', color: '#673AB7' },
];
