import React, {useState, useEffect, useCallback, useRef} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {ALL_QUESTIONS, TOPICS} from '../data/quizQuestions.mjs';
import {filterQuestions, prepareSession, calculatePoints, accuracy} from '../utils/quiz.mjs';

const LEVELS = [
  {id: 'all', label: 'Tất cả câu hỏi'},
  {id: 'core', label: 'Bộ câu hỏi gốc'},
  {id: 'senior', label: 'Tình huống Senior'},
];
const RANKS = [
  {min: 90, label: '🌟 Nắm vững bài ôn', desc: 'Thử giải thích thêm các đánh đổi và failure case trong từng tình huống.', color: '#1b9c5a'},
  {min: 75, label: '🎯 Kiến thức khá vững', desc: 'Ôn lại câu sai và thử áp dụng vào một bài thực hành.', color: '#2196F3'},
  {min: 50, label: '📚 Tiếp tục củng cố', desc: 'Mở bài đọc liên quan để hiểu cơ chế trước khi làm lại.', color: '#b66a00'},
  {min: 0, label: '🌱 Xây nền tảng', desc: 'Bắt đầu bằng chế độ ôn tập và đọc kỹ lời giải từng câu.', color: '#607D8B'},
];

function StudyLink({question}) {
  return <Link className="quiz-study-link" to={question.docLink} target="_blank" rel="noopener noreferrer" aria-label="Đọc bài liên quan (mở trong tab mới)">📖 Đọc bài liên quan ↗</Link>;
}

export default function QuizPage() {
  const [screen, setScreen] = useState('home');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [mode, setMode] = useState('practice');
  const [questionCount, setQuestionCount] = useState(15);
  const [sessionMode, setSessionMode] = useState('practice');
  const [isRetry, setIsRetry] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timer, setTimer] = useState(20);
  const answeredRef = useRef(false);
  const questionRef = useRef(null);
  const resultRef = useRef(null);

  const pool = filterQuestions(ALL_QUESTIONS, selectedTopic, selectedLevel);
  const currentQ = questions[currentIdx];
  const currentAnswer = answers[currentIdx];
  const totalQ = questions.length;
  const timed = sessionMode === 'challenge';
  const score = answers.reduce((sum, answer) => sum + answer.points, 0);
  const streak = answers.reduce((count, answer) => answer.isCorrect ? count + 1 : 0, 0);
  const correctCount = answers.filter(answer => answer.isCorrect).length;
  const wrongAnswers = answers.filter(answer => !answer.isCorrect);
  const percentage = accuracy(answers);
  const rank = RANKS.find(item => percentage >= item.min);

  const beginSession = (questionPool, retry = false) => {
    const prepared = prepareSession(questionPool, retry ? questionPool.length : questionCount);
    if (!prepared.length) return;
    answeredRef.current = false;
    setQuestions(prepared);
    setCurrentIdx(0);
    setAnswers([]);
    setTimer(prepared[0].duration);
    setSessionMode(retry ? 'practice' : mode);
    setIsRetry(retry);
    setScreen('playing');
  };

  const handleAnswer = useCallback((selectedIdx) => {
    if (screen !== 'playing' || !currentQ || currentAnswer || answeredRef.current) return;
    answeredRef.current = true;
    const isCorrect = selectedIdx === currentQ.correctOptionIdx;
    const points = calculatePoints(isCorrect, timer, currentQ.duration, isCorrect ? streak + 1 : 0, timed);
    setAnswers(previous => [...previous, {
      question: currentQ,
      selectedIdx,
      isCorrect,
      ...points,
      elapsed: timed ? currentQ.duration - timer : null,
    }]);
  }, [screen, currentQ, currentAnswer, timer, streak, timed]);

  useEffect(() => {
    if (screen !== 'playing' || !timed || currentAnswer) return undefined;
    if (timer <= 0) {
      handleAnswer(-1);
      return undefined;
    }
    const timeout = setTimeout(() => setTimer(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [screen, timed, currentAnswer, timer, handleAnswer]);

  useEffect(() => {
    if (screen === 'playing') questionRef.current?.focus();
    if (screen === 'result') resultRef.current?.focus();
  }, [screen, currentIdx]);

  const goNext = () => {
    if (!currentAnswer) return;
    if (currentIdx + 1 === totalQ) {
      setScreen('result');
      return;
    }
    answeredRef.current = false;
    setTimer(questions[currentIdx + 1].duration);
    setCurrentIdx(index => index + 1);
  };

  const restartHome = () => {
    answeredRef.current = false;
    setScreen('home');
    setQuestions([]);
    setAnswers([]);
    setCurrentIdx(0);
  };

  const timerColor = timer > currentQ?.duration / 2 ? '#1b9c5a' : timer > 5 ? '#b66a00' : '#d32f2f';
  const fastest = answers.filter(answer => answer.isCorrect && answer.elapsed !== null);

  return (
    <Layout title="Android Quiz" description="Ôn phỏng vấn Android từ nền tảng đến tình huống Senior, có lời giải và bài đọc liên quan">
      <div className="quiz-root">
        {screen === 'home' && (
          <div className="quiz-home">
            <div className="quiz-home-hero">
              <div className="quiz-home-icon" aria-hidden="true">🤖</div>
              <h1 className="quiz-home-title">Android Knowledge Quiz</h1>
              <p className="quiz-home-subtitle">
                Ôn theo bộ câu hỏi phỏng vấn Android.<br />
                Hiểu cơ chế, luyện tình huống và đọc lại phần chưa vững.
              </p>
              <Link to="/interview/senior-android">📚 Xem lộ trình Senior Android →</Link>
            </div>
            <div className="quiz-stats-row">
              <div className="quiz-stat-card"><span className="quiz-stat-num">{ALL_QUESTIONS.length}</span><span className="quiz-stat-label">Câu hỏi</span></div>
              <div className="quiz-stat-card"><span className="quiz-stat-num">{TOPICS.length - 1}</span><span className="quiz-stat-label">Chủ đề</span></div>
              <div className="quiz-stat-card"><span className="quiz-stat-num">{ALL_QUESTIONS.filter(q => q.level === 'senior').length}</span><span className="quiz-stat-label">Tình huống Senior</span></div>
            </div>
            <div className="quiz-settings">
              <label>Bộ câu hỏi
                <select value={selectedLevel} onChange={event => setSelectedLevel(event.target.value)}>
                  {LEVELS.map(level => <option key={level.id} value={level.id}>{level.label}</option>)}
                </select>
              </label>
              <label>Chế độ
                <select value={mode} onChange={event => setMode(event.target.value)}>
                  <option value="practice">Ôn tập · Không giới hạn giờ</option>
                  <option value="challenge">Thử thách · Có đếm giờ</option>
                </select>
              </label>
              <label>Số câu mỗi lượt
                <select value={questionCount} onChange={event => setQuestionCount(Number(event.target.value))}>
                  {[10, 15, 30].map(count => <option key={count} value={count}>{count} câu</option>)}
                </select>
              </label>
            </div>
            <p className="quiz-session-note">
              {mode === 'practice' ? 'Đọc kỹ tình huống, trả lời và xem giải thích theo tốc độ của bạn.' : '20 giây/câu gốc · 60 giây/tình huống Senior. Đúng nhanh có thêm điểm, mỗi chuỗi 3 câu đúng thưởng 5 điểm.'}
            </p>
            <h2 className="quiz-section-title">Chọn chủ đề</h2>
            <div className="quiz-topics-grid">
              {TOPICS.map(topic => {
                const count = filterQuestions(ALL_QUESTIONS, topic.id, selectedLevel).length;
                return (
                  <button key={topic.id} type="button" className={`quiz-topic-btn ${selectedTopic === topic.id ? 'active' : ''}`}
                    aria-pressed={selectedTopic === topic.id}
                    style={selectedTopic === topic.id ? {borderColor: topic.color, backgroundColor: topic.color + '22'} : {}}
                    onClick={() => setSelectedTopic(topic.id)}>
                    <span>{topic.label}</span><span className="quiz-topic-count">{count} câu</span>
                  </button>
                );
              })}
            </div>
            <p className="quiz-session-note" role="status">
              {pool.length ? `Lượt này gồm ${Math.min(questionCount, pool.length)} câu ngẫu nhiên từ ${pool.length} câu phù hợp.` : 'Chưa có câu hỏi trong bộ lọc này. Hãy chọn chủ đề hoặc bộ câu hỏi khác.'}
            </p>
            <button type="button" className="quiz-start-btn" disabled={!pool.length} onClick={() => beginSession(pool)}>▶ Bắt đầu luyện tập</button>
            <p className="quiz-session-note">Kết quả dựa trên tỷ lệ câu đúng. Điểm quiz không xác định cấp bậc nghề nghiệp.</p>
          </div>
        )}

        {screen === 'playing' && currentQ && (
          <div className="quiz-playing">
            <div className="quiz-play-header">
              <button type="button" className="quiz-exit-btn" onClick={restartHome}>✕ Thoát</button>
              <div className="quiz-play-meta">
                <span className="quiz-play-topic">{currentQ.topicLabel}</span>
                <span className="quiz-play-progress">{currentIdx + 1} / {totalQ}</span>
              </div>
              <div className="quiz-score-display"><span>⭐ {score}</span>{streak >= 2 && <span className="quiz-streak">🔥 {streak}</span>}</div>
            </div>
            <div className="quiz-progress-bar" role="progressbar" aria-label="Số câu đã trả lời" aria-valuenow={answers.length} aria-valuemin={0} aria-valuemax={totalQ}>
              <div className="quiz-progress-fill" style={{width: `${answers.length / totalQ * 100}%`}} />
            </div>
            <p className="quiz-session-note">{isRetry ? 'Ôn lại câu sai · ' : ''}{currentQ.level === 'senior' ? 'Tình huống Senior' : 'Bộ câu hỏi gốc'} · {timed ? 'Thử thách' : 'Ôn tập không đếm giờ'}</p>
            {timed && (
              <div className="quiz-timer-row">
                <div className="quiz-timer-bar" aria-hidden="true"><div className="quiz-timer-fill" style={{width: `${timer / currentQ.duration * 100}%`, backgroundColor: timerColor}} /></div>
                <span className="quiz-timer-num" style={{color: timerColor}} aria-label={`Còn ${timer} giây`}>{timer}s</span>
              </div>
            )}
            <div className="quiz-question-card"><h2 ref={questionRef} tabIndex={-1} className="quiz-question-text">{currentQ.question}</h2></div>
            <div className="quiz-options-grid">
              {currentQ.shuffledOptions.map((option, index) => {
                const correct = index === currentQ.correctOptionIdx;
                const chosen = index === currentAnswer?.selectedIdx;
                const state = currentAnswer ? correct ? ' correct' : chosen ? ' wrong' : ' disabled' : '';
                return (
                  <button key={option.originalIdx} type="button" className={`quiz-option${state}`} onClick={() => handleAnswer(index)} disabled={Boolean(currentAnswer)}>
                    <span className="quiz-option-label">{String.fromCharCode(65 + index)}</span>
                    <span className="quiz-option-text">{option.text}{currentAnswer && correct && ' ✓ Đáp án đúng'}{currentAnswer && chosen && !correct && ' ✕ Bạn đã chọn'}</span>
                  </button>
                );
              })}
            </div>
            <div aria-live="polite" aria-atomic="true">
              {currentAnswer && (
                <div className="quiz-explanation">
                  <div className="quiz-explanation-header">
                    <span>{currentAnswer.isCorrect ? '✅ Chính xác!' : currentAnswer.selectedIdx === -1 ? '⏰ Hết giờ!' : '❌ Chưa chính xác'}</span>
                    <span className="quiz-points-earned">+{currentAnswer.points} điểm</span>
                  </div>
                  {currentAnswer.bonus > 0 && <p>🔥 Combo! +{currentAnswer.bonus} điểm thưởng</p>}
                  <p className="quiz-explanation-text">{currentQ.explanation}</p>
                  <StudyLink question={currentQ} />
                  <button type="button" className="quiz-next-btn" onClick={goNext}>{currentIdx + 1 === totalQ ? '🏁 Xem kết quả' : 'Câu tiếp →'}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 'result' && (
          <div className="quiz-result">
            <div className="quiz-result-hero">
              <h1 ref={resultRef} tabIndex={-1} className="quiz-result-rank-badge" style={{color: rank.color}}>{rank.label}</h1>
              <div className="quiz-result-score-circle" style={{borderColor: rank.color}}>
                <span className="quiz-result-pct">{percentage}%</span>
                <span className="quiz-result-score-label">{correctCount} / {totalQ} câu đúng</span>
              </div>
              <p className="quiz-result-desc">{rank.desc}</p>
            </div>
            <div className="quiz-result-stats">
              <div className="quiz-result-stat"><span className="quiz-result-stat-num">{score}</span><span>Điểm luyện tập</span></div>
              <div className="quiz-result-stat"><span className="quiz-result-stat-num">{wrongAnswers.length}</span><span>Sai / hết giờ</span></div>
              <div className="quiz-result-stat"><span className="quiz-result-stat-num">{fastest.length ? `${Math.min(...fastest.map(answer => answer.elapsed))}s` : '—'}</span><span>Câu đúng nhanh nhất</span></div>
            </div>
            <p className="quiz-session-note">Tỷ lệ đúng tính theo số câu, độc lập với tốc độ và điểm thưởng.</p>
            <div className="quiz-topic-results">
              <h2 className="quiz-section-title">Kết quả theo chủ đề</h2>
              <ul>{TOPICS.filter(topic => topic.id !== 'all').map(topic => {
                const group = answers.filter(answer => answer.question.topic === topic.id);
                return group.length ? <li key={topic.id}><span>{topic.label}</span><strong>{group.filter(answer => answer.isCorrect).length}/{group.length} · {accuracy(group)}%</strong></li> : null;
              })}</ul>
            </div>
            <div className="quiz-result-actions">
              {wrongAnswers.length > 0 && <button type="button" className="quiz-start-btn" onClick={() => beginSession(wrongAnswers.map(answer => answer.question), true)}>📖 Ôn {wrongAnswers.length} câu sai</button>}
              <button type="button" className="quiz-outline-btn" onClick={() => beginSession(pool)}>🔄 Lượt mới</button>
              <button type="button" className="quiz-outline-btn" onClick={restartHome}>Chọn lại chủ đề</button>
            </div>
            {wrongAnswers.length > 0 && (
              <div className="quiz-review">
                <h2 className="quiz-review-title">📝 Xem lại câu sai và hết giờ</h2>
                {wrongAnswers.map(answer => (
                  <div key={answer.question.id} className="quiz-review-item">
                    <h3 className="quiz-review-q">{answer.question.question}</h3>
                    {answer.selectedIdx === -1 && <p>⏰ Bạn chưa trả lời trước khi hết giờ.</p>}
                    <div className="quiz-review-answers">
                      {answer.question.shuffledOptions.map((option, index) => (
                        <div key={option.originalIdx} className={`quiz-review-opt ${index === answer.question.correctOptionIdx ? 'correct' : index === answer.selectedIdx ? 'wrong' : ''}`}>
                          <span className="quiz-option-label">{String.fromCharCode(65 + index)}</span>
                          <span>{option.text}{index === answer.question.correctOptionIdx ? ' ✓ Đúng' : index === answer.selectedIdx ? ' ✕ Bạn chọn' : ''}</span>
                        </div>
                      ))}
                    </div>
                    <p className="quiz-review-explanation">💡 {answer.question.explanation}</p>
                    <StudyLink question={answer.question} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
