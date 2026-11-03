# Learning platform integration

The learning module extends the existing Docusaurus 3.9.2 / React 19 site. Documentation remains the source of reusable technical explanations; the quiz scoring and question bank are unchanged. No new runtime dependency, account, paid API or backend is required.

## Repository findings and integration plan

- Documentation lives at `/` (`routeBasePath: '/'`); only `intro.md` overrides its route. Learning owns the distinct `/learn` prefix.
- The existing quiz has 130 questions and pure scoring utilities with six tests. Questions already carry stable numeric IDs, topic IDs, and real documentation links.
- Learning follows the existing Infima colors and `--ak-*` card tokens. Styles are scoped with a CSS module.
- Implementation order: content and pure services → static lesson route plugin → shared progress hook and pages → quiz history bridge → unit/build/browser verification.
- The original LevelUp HTML was **not supplied**. These are 24 newly authored lessons (two per month), not a migration of the original 60 lessons or 12 introductory tasks. The eight new capstone milestones implement the requested Android AI video movement analysis project. Existing lesson IDs must remain stable in future releases.

## Routes and source layout

| Route | Implementation |
| --- | --- |
| `/learn` | Dashboard: evidence-based progress, current phase, next prerequisite-ready lesson, weekly logged minutes, reviews and actual activity |
| `/learn/roadmap` | Searchable four-phase / twelve-month curriculum |
| `/learn/lesson/<id>` | 24 concrete static routes registered by `plugins/learning/index.cjs` |
| `/learn/practice` | Eight capstone milestone drafts, criteria, evidence URLs and notes |
| `/learn/skills` | Per-lesson rubric status, weak dimensions and quiz history / incorrect answers |
| `/learn/journal` | Dated learning sessions, duration, problems, solutions and next actions; filtering |
| `/learn/settings` | Weekly goal, configurable rubric weights, JSON backup/restore and LevelUp archival |

`src/data/learning/{foundation,engineering,ai,career}.mjs` contains the curriculum. Each lesson declares actual repository documentation routes, prerequisites, measurable objectives, technical explanations, code with context/limitations, guided practice, an independent challenge, acceptance criteria, a follow-up and interview questions. `roadmap.mjs` is the combined index and explicit lesson-to-document mapping. The route plugin reads the corresponding Markdown title, so link labels follow the documentation.

`src/services/learning/` holds the pure assessment, review, mapping and storage logic. `useLearningProgress.js` isolates the browser adapter and mutations from presentation. Components consume its actions; a future asynchronous backend can be introduced in this hook/service boundary. A single LearningProvider is mounted per learning page; storage is reloaded on navigation and storage events.

Lesson theory, exercises, resources and code render during static generation. Browser progress and forms initialize after hydration. No browser API is accessed during SSR. Concrete lesson routes generate HTML for direct navigation/refresh on GitHub Pages; no runtime wildcard routing or Next.js convention is used.

## Assessment rules

Each lesson defines one assessable skill. States are derived from immutable evidence and assessment history, never a persisted `completed` flag:

| State | Rule |
| --- | --- |
| Not Started | No lesson progress record |
| Learning | Started or checklist edited; no evidence submitted |
| Practice Submitted | Practical evidence recorded, no assessment yet |
| Needs Review | Latest assessment fails its rubric, or scheduled review is due |
| Passed | Latest rubric passes, review not overdue |
| Mastered | Passed follow-up with a different evidence record, created and assessed at least 24 hours after an earlier pass; review not overdue |

Default weights are knowledge 20, coding 40, testing 20, reasoning 20. Each dimension is an integer 0–4. The weighted percentage is normalized over the sum of configured positive weights. Passing needs every dimension ≥3, total ≥75%, every acceptance criterion checked at assessment time, and nonempty implementation, test report and reasoning in the referenced evidence. The weights are configurable learning defaults, not a validated scientific instrument. Each attempt stores its own weights and criterion snapshot.

All practical scores and test reports are **self-reported**. The website does not execute Kotlin, inspect GitHub artifacts or provide independent certification. A quiz never changes the practical assessment state. Completion percentage counts latest rubric passes; an overdue review does not erase completed work, while the current state becomes Needs Review. A later failed assessment removes that lesson from the current pass count.

Review scheduling uses exact elapsed UTC durations: successful attempts advance 1 → 7 → 30 days (then stay at 30); failures reset to one day. The scheduler accepts an explicit timestamp for deterministic tests. These are starting intervals, not an optimal schedule for every learner. Dates display in the learner's local browser timezone. Weekly time comes from journal dates since local Monday; future entries are excluded.

## Quiz bridge

`/quiz` retains its existing topic/level filters, practice/challenge modes, retry behavior and points. `/quiz?lesson=<id>` scopes questions by **both** the declared topic and the question's actual documentation route. Lessons without directly relevant existing questions show a clear empty state instead of inventing questions. `/quiz?review=wrong` offers historical incorrect answers.

Only completed sessions are stored. History records original question/answer IDs (not shuffled positions), correct/incorrect results, points, timestamp and session mode. The skills page links wrong answers to their existing explanatory article and mapped lessons. In-progress sessions are not resumed after reload. Historical wrong-answer review includes earlier errors even if a later attempt was correct.

## Storage, migration and backup

Storage key: `android-knowledge-learning-v1`; payload `schemaVersion: 2`.

- The versioned document contains lessons (checklists, evidence, assessments, deterministic review), projects, journal, quiz sessions, preferences and original LevelUp archives.
- Missing storage starts empty. Malformed, unavailable or unsupported storage displays an error and blocks writes, retaining the original bytes. An explicit valid restore first preserves corrupt bytes under a timestamped recovery key. If that preservation fails, restoration aborts.
- Imports are validated before writing, including sizes, IDs, URLs, dates, scores, criterion counts, known lessons/projects, answer correctness, and review replay. Unknown lesson IDs or future versions are rejected rather than dropped. Maximum backup size is 5 MB; original LevelUp archive size is 2 MB.
- History merges by ID. Identical records are deduplicated; conflicting records abort import. Current checklist drafts, project drafts and preferences win when both backups contain the same item. Import success text describes this policy.
- Schema 1 is the documented pre-release AKH shape: the same required lessons/projects/journal/quizzes fields, optionally missing preferences and legacyArchives. Migration adds defaults without changing histories. This compatibility format does not imply that a deployed LevelUp release used it.
- No original `levelup-android-v1` schema or ID map was available. The UI can preserve that key's exact JSON or import the old application's JSON into an archive, then include it in exports. It does **not** guess lesson IDs or convert old checkboxes into passes. Supplying the original HTML/schema is required for semantic LevelUp migration. The old key is never modified.
- localStorage belongs to a website origin. Export in the old HTML's origin, then import/archive at the new origin. There is no automatic transfer from `file://`, another domain or another device, and no cross-device synchronization.
- Storage events keep tabs informed; simultaneous writes from multiple tabs are not a transactional database. Prefer one editing tab and periodic backups. Browser quota/private-mode limitations are surfaced to the learner.

No video, APK or source repository is uploaded to this site. Evidence consists of text and optional HTTP(S) links. Learners should keep credentials and private media out of evidence and backups.

## Verification

```sh
npm ci
npm run test:quiz
npm run test:learning
npm run build
npm run serve -- --host 127.0.0.1 --port 3080 --no-open
```

`prebuild` runs both test suites. A separate pull-request workflow builds and checks the website without deploying. The existing main-branch Pages deployment workflow, `url`, `baseUrl`, documentation and quiz routes are preserved.

Unit coverage includes curriculum/doc mappings and prerequisite cycles, progress/completion rules, configurable scoring, evidence and follow-up requirements, exact review timing, malformed/unsafe/import size limits, schema migration, conflict-safe merges, corrupt-data recovery, quota failures, LevelUp archival and shuffled quiz-to-skill history. Android snippets are contextual examples; this JavaScript repository does not compile or execute Kotlin.

Verified locally on Node 26.10.0: `npm ci`, all six original quiz tests, all fifteen learning tests, and `npm run build` passed. The exact committed source was also exported separately, installed with its own dependencies, and passed the same suites and build without the two pre-existing local documentation edits. Artifact checks verified all thirty learning routes, all twenty-four static lesson bodies and internal lesson links, plus the original quiz/interview/home outputs.

Browser QA covered desktop (1440×1000) and mobile (390×844), light/dark modes, actual empty states, checklist/evidence submission, rubric passing and reload persistence, journal-to-weekly-goal updates, milestone persistence, JSON download/file restore, malformed-import rejection, lesson-scoped quiz completion, saved original answers and wrong-answer review, and a real documentation link. The inspected flows reported no browser console warnings/errors or horizontal mobile page overflow. The 24-hour follow-up rule and review-date transitions were tested with explicit unit-test timestamps rather than a fabricated browser achievement.

Non-failing build output includes stale Browserslist data, search-index serialization notices, and Node 26's experimental localStorage warning. No dependencies were upgraded to address unrelated notices. The configured Node 20 pull-request CI has not run remotely: terminal Git lacks HTTPS credentials and the connected GitHub integration returned HTTP 403 when publishing Git objects. The two feature commits remain local; no production merge or deployment was performed.
