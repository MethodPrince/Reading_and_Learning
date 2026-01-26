import { useEffect, useState } from "react";
import "../../styles/ReadingEngine.css";

interface WordDefinition {
  word: string;
  meaning: string;
}

interface Question {
  type: string;
  question: string;
  options: string[];
  answer: string;
}

interface ContentItem {
  id: number;
  grade: string;
  subject: string;
  term: string;
  mainTopic: string;
  subTopic: string;
  description: string;
  definitions: WordDefinition[];
  questions: Question[];
}

export default function ReadingEngine({ 
  selectedGrade, 
  userId = "student1" 
}: { 
  selectedGrade: string;
  userId?: string;
}) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState<'notes' | 'questions'>('notes');
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:4000/api/content`)
      .then((res) => res.json())
      .then((data) => {
        const gradeContent = data.filter((item: ContentItem) => item.grade === selectedGrade);
        setContent(gradeContent);
      })
      .catch(console.error);
  }, [selectedGrade]);

  const handleAnswer = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitAnswers = () => {
    if (!selectedContent) return;
    
    let correctCount = 0;
    selectedContent.questions.forEach((q, index) => {
      const questionId = `q${index}`;
      if (userAnswers[questionId] === q.answer) {
        correctCount++;
      }
    });
    
    const percentage = (correctCount / selectedContent.questions.length) * 100;
    setScore(percentage);
    setShowResults(true);
    
    // Save results to localStorage
    const results = {
      userId,
      contentId: selectedContent.id,
      score: percentage,
      answers: userAnswers,
      timestamp: new Date().toISOString()
    };
    
    const savedResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    savedResults.push(results);
    localStorage.setItem('quizResults', JSON.stringify(savedResults));
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="reading-engine-container">
      <div className="sidebar">
        <div className="progress-card">
          <h3>📊 Progress</h3>
          <p>Grade: {selectedGrade}</p>
          <p>Topics: {content.length}</p>
          {score > 0 && (
            <p className="latest-score">Latest Score: {score.toFixed(1)}%</p>
          )}
        </div>

        <h3>📚 Available Topics</h3>
        <div className="topics-list">
          {content.map((item) => (
            <div 
              key={item.id}
              className={`topic-card ${selectedContent?.id === item.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedContent(item);
                setViewMode('notes');
                resetQuiz();
              }}
            >
              <div className="topic-header">
                <h4>{item.mainTopic}</h4>
                <span className="topic-meta">{item.term}</span>
              </div>
              <p className="topic-subject">{item.subject}</p>
              <p className="topic-subtopic">{item.subTopic}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="content-area">
        {selectedContent ? (
          <>
            <div className="content-header">
              <div>
                <h2>{selectedContent.mainTopic}</h2>
                <p className="content-subtitle">
                  {selectedContent.subTopic} | {selectedContent.subject} | {selectedContent.term}
                </p>
              </div>
              <div className="mode-switcher">
                <button 
                  className={viewMode === 'notes' ? 'active' : ''}
                  onClick={() => setViewMode('notes')}
                >
                  📖 Study Notes
                </button>
                <button 
                  className={viewMode === 'questions' ? 'active' : ''}
                  onClick={() => setViewMode('questions')}
                >
                  ❓ Practice Quiz
                </button>
              </div>
            </div>

            {viewMode === 'notes' ? (
              <div className="notes-container">
                <div className="description-section">
                  <h3>📝 Description</h3>
                  <div className="description-content">
                    <p>{selectedContent.description}</p>
                  </div>
                </div>

                {selectedContent.definitions && selectedContent.definitions.length > 0 && (
                  <div className="definitions-section">
                    <h3>📚 Key Terms & Definitions</h3>
                    <div className="definitions-grid">
                      {selectedContent.definitions.map((def, idx) => (
                        <div key={idx} className="definition-card">
                          <div className="word-header">
                            <span className="word-index">{idx + 1}</span>
                            <h4>{def.word}</h4>
                          </div>
                          <p className="word-meaning">{def.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="quiz-preview">
                  <h3>💡 Ready to Test Your Knowledge?</h3>
                  <p>This topic has {selectedContent.questions.length} practice questions.</p>
                  <button 
                    className="start-quiz-btn"
                    onClick={() => setViewMode('questions')}
                  >
                    Start Quiz Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="questions-container">
                <div className="quiz-header">
                  <h3>🧠 Quiz: {selectedContent.subTopic}</h3>
                  <p>Answer all questions and submit to see your score</p>
                </div>

                {selectedContent.questions.map((question, index) => {
                  const questionId = `q${index}`;
                  const isAnswered = userAnswers[questionId];
                  
                  return (
                    <div key={index} className="question-card">
                      <div className="question-number">
                        Question {index + 1} of {selectedContent.questions.length}
                      </div>
                      
                      <p className="question-text">{question.question}</p>
                      
                      <div className="options-container">
                        {question.options.map((option, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          let className = "option-button";
                          
                          if (showResults) {
                            if (option === question.answer) {
                              className += " correct";
                            } else if (option === userAnswers[questionId]) {
                              className += " wrong";
                            }
                          } else if (option === userAnswers[questionId]) {
                            className += " selected";
                          }
                          
                          return (
                            <button
                              key={optIdx}
                              className={className}
                              onClick={() => !showResults && handleAnswer(questionId, option)}
                              disabled={showResults}
                            >
                              <span className="option-letter">{letter}</span>
                              <span className="option-text">{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {showResults && isAnswered && (
                        <div className="answer-feedback">
                          {isAnswered === question.answer ? (
                            <div className="feedback-correct">
                              ✅ Correct! You chose the right answer.
                            </div>
                          ) : (
                            <div className="feedback-incorrect">
                              ❌ Your answer was incorrect. The correct answer is: 
                              <strong> {question.answer}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="quiz-footer">
                  {!showResults ? (
                    <div className="submit-section">
                      <p className="answers-count">
                        {Object.keys(userAnswers).length} of {selectedContent.questions.length} questions answered
                      </p>
                      <button 
                        className="submit-btn"
                        onClick={submitAnswers}
                        disabled={Object.keys(userAnswers).length !== selectedContent.questions.length}
                      >
                        Submit Answers
                      </button>
                      <p className="hint">
                        Complete all questions to submit
                      </p>
                    </div>
                  ) : (
                    <div className="results-section">
                      <div className="score-display">
                        <h3>📊 Quiz Results</h3>
                        <div className="score-circle">
                          <span className="score-percentage">{score.toFixed(1)}%</span>
                        </div>
                        <p className="score-message">
                          You scored {score.toFixed(1)}% on this quiz!
                        </p>
                        <div className="result-breakdown">
                          <p>Correct Answers: {Math.round((score / 100) * selectedContent.questions.length)}</p>
                          <p>Total Questions: {selectedContent.questions.length}</p>
                        </div>
                        <div className="result-actions">
                          <button 
                            className="retry-btn"
                            onClick={resetQuiz}
                          >
                            ↻ Try Again
                          </button>
                          <button 
                            className="notes-btn"
                            onClick={() => setViewMode('notes')}
                          >
                            📖 Review Notes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h2>Welcome to {selectedGrade} Learning!</h2>
              <p className="welcome-subtitle">
                Select a topic from the sidebar to start learning
              </p>
              <div className="welcome-features">
                <div className="feature">
                  <div className="feature-icon">📖</div>
                  <h4>Study Notes</h4>
                  <p>Read detailed explanations and definitions</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">❓</div>
                  <h4>Practice Quizzes</h4>
                  <p>Test your knowledge with interactive questions</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">📊</div>
                  <h4>Track Progress</h4>
                  <p>Monitor your learning journey</p>
                </div>
              </div>
              <div className="content-stats">
                <p>
                  <strong>{content.length}</strong> topics available for {selectedGrade}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}