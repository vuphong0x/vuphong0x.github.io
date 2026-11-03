export const milestones = [
  {
    id: 'requirements',
    title: 'Yêu cầu và kiến trúc',
    lessons: ['android-system-design', 'complex-design'],
    deliverables: [
      'Requirements, device/privacy constraints',
      'Data-flow diagram và ADR local/cloud',
    ],
    requirements: 'Xác định workload, lifetime, storage, trust boundaries và budget dự kiến.',
    criteria: [
      'Có hai phương án với trade-offs.',
      'Failure matrix bao phủ cancel, offline và process death.',
    ],
  },
  {
    id: 'foundation',
    title: 'Android project foundation',
    lessons: ['modularization-di', 'testing-delivery'],
    deliverables: ['Repository build được từ máy sạch', 'Module graph, DI và CI workflow'],
    requirements: 'Pin dependency, cấu hình test scheduler và phân tách feature/storage.',
    criteria: ['CI chạy unit tests và build.', 'Có fake repository và không cycle module.'],
  },
  {
    id: 'video',
    title: 'Video import và playback',
    lessons: ['android-state-recovery', 'media-pose-pipeline'],
    deliverables: ['Import URI và Media3 playback', 'State restoration và error UX'],
    requirements: 'Quản lý quyền URI, playback owner, lifecycle và missing file.',
    criteria: [
      'Test rotation/process recreation theo contract.',
      'Mất URI có fallback và không crash.',
    ],
  },
  {
    id: 'frames',
    title: 'Frame extraction',
    lessons: ['media-pose-pipeline', 'performance-debugging'],
    deliverables: ['Bounded extraction pipeline', 'Timestamp, orientation và memory report'],
    requirements: 'Không giữ toàn bộ frames; lưu timestamp thực và cleanup khi cancel.',
    criteria: [
      'Queue/buffers bounded trong trace.',
      'Test variable frame rate, rotation và cancel.',
    ],
  },
  {
    id: 'pose',
    title: 'Pose estimation integration',
    lessons: ['on-device-inference'],
    deliverables: ['Pinned model/runtime manifest', 'Pose overlay và benchmark'],
    requirements: 'Preprocessing/version rõ, hỗ trợ missing landmark và device fallback.',
    criteria: [
      'Transform tests đúng crop/mirror/rotation.',
      'Có device matrix và latency measurement.',
    ],
  },
  {
    id: 'movement',
    title: 'Movement analysis',
    lessons: ['ai-evaluation'],
    deliverables: ['Metric/normalization contract', 'Fixture có ground truth và unknown state'],
    requirements: 'Phân biệt thiếu dữ liệu với chuyển động sai; kiểm tra temporal smoothing.',
    criteria: [
      'Deterministic tests cho metric.',
      'Báo precision và coverage theo slice, không số giả.',
    ],
  },
  {
    id: 'feedback',
    title: 'AI feedback và evaluation',
    lessons: ['llm-contracts', 'tool-calling', 'backend-data'],
    deliverables: [
      'Validated feedback schema và fake gateway',
      'Held-out eval report và privacy decision',
    ],
    requirements: 'Không secret trong client; bounded retry/tool allowlist và idempotency.',
    criteria: [
      'Test invalid output, timeout/refusal và authorization.',
      'Feedback có provenance và abstention policy.',
    ],
  },
  {
    id: 'release',
    title: 'Testing, performance và deployment plan',
    lessons: ['portfolio-capstone', 'production-debugging'],
    deliverables: [
      'Reproducible demo và CI reports',
      'Performance/accessibility report, rollout và rollback plan',
    ],
    requirements: 'Đo trên thiết bị, kiểm tra data migration và gắn evidence theo commit.',
    criteria: [
      'Fresh-clone build/test chạy được.',
      'Known limitations, retention và release stop conditions rõ.',
    ],
  },
];
