import { useEffect, useState } from "react";
import "../../styles/StudentDashboard.css";

type User = {
  id: string;
  name: string;
  email: string;
  grade: string;
  maxAttempts: number;
  attemptsUsed: number;
};

type Content = {
  _id: string;
  mainTopic: string;
  subject: string;
  description: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  definitions?: Array<{ word: string; meaning: string }>;
};

type Submission = {
  _id: string;
  contentId: Content;
  score: number;
  total: number;
  answers: Array<{
    question: string;
    selected: string;
    correctAnswer: string;
    correct: boolean;
  }>;
  submittedAt: string;
  isManuallyReviewed: boolean;
  adminFeedback: string;
};

export default function StudentDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [content, setContent] = useState<Content[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadContent();
    loadSubmissions();
  }, []);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/content?grade=${user.grade}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setContent(data);
    } catch (err) {
      setError("Failed to load content");
    }
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/submissions/student/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (contentItem: Content) => {
    const attempts = submissions.filter(s => s.contentId?._id === contentItem._id).length;
    if (attempts >= user.maxAttempts) {
      alert(`Maximum attempts (${user.maxAttempts}) reached for this quiz.`);
      return;
    }
    
    setSelectedContent(contentItem);
    setAnswers(new Array(contentItem.questions.length).fill(""));
    setShowQuiz(true);
    setShowReview(false);
  };

  const submitQuiz = async () => {
    if (!selectedContent) return;

    try {
      const token = localStorage.getItem('token');
      // FIXED: Changed from /api/submit-quiz to /api/submissions/submit-quiz
      const res = await fetch("http://localhost:4000/api/submissions/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId: selectedContent._id,
          answers
        }),
      });

      const data = await res.json();
      
      console.log("Submit quiz response:", data); // For debugging
      
      if (res.ok && data.success) {
        alert(`Quiz submitted! Score: ${data.score}/${data.total}\nAttempts left: ${data.attemptsLeft}`);
        loadSubmissions();
        setShowQuiz(false);
        setSelectedSubmission({
          _id: 'new',
          contentId: selectedContent,
          score: data.score,
          total: data.total,
          answers: data.review,
          submittedAt: new Date().toISOString(),
          isManuallyReviewed: false,
          adminFeedback: ''
        });
        setShowReview(true);
      } else {
        alert(data.message || "Submission failed");
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert("Network error. Please check your connection.");
    }
  };

  const viewReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReview(true);
    setShowQuiz(false);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h2>Welcome, {user.name}</h2>
            <p>{user.grade} • {user.attemptsUsed}/{user.maxAttempts} Attempts Used</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="content-section">
          <h3>Available Notes & Quizzes</h3>
          <div className="content-grid">
            {content.map((item) => {
              const attempts = submissions.filter(s => s.contentId?._id === item._id).length;
              return (
                <div key={item._id} className="content-card">
                  <span className="card-badge">{item.subject}</span>
                  <h4 className="card-title">{item.mainTopic}</h4>
                  <p className="card-description">{item.description}</p>
                  <div className="card-stats">
                    <span>📝 {item.questions.length} Questions</span>
                    <span>📚 {item.definitions?.length || 0} Terms</span>
                    <span>🔄 {attempts}/{user.maxAttempts} Attempts</span>
                  </div>
                  <div className="card-actions">
                    <button className="primary-btn" onClick={() => startQuiz(item)}>
                      Start Quiz
                    </button>
                    <button className="secondary-btn" onClick={() => alert('Study notes coming soon!')}>
                      View Notes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submissions History */}
        <div className="submissions-section">
          <h3>Your Quiz History</h3>
          <div className="submissions-list">
            {submissions.map((sub) => (
              <div key={sub._id} className="submission-card">
                <div className="submission-header">
                  <span className="topic">{sub.contentId?.mainTopic}</span>
                  <span className={`score ${sub.score >= sub.total * 0.7 ? 'good' : 'bad'}`}>
                    {sub.score}/{sub.total}
                  </span>
                </div>
                <div className="submission-details">
                  <span>📅 {new Date(sub.submittedAt).toLocaleDateString()}</span>
                  <span>⏰ {new Date(sub.submittedAt).toLocaleTimeString()}</span>
                  {sub.isManuallyReviewed && <span>👨‍🏫 Manually Reviewed</span>}
                </div>
                <button className="review-btn" onClick={() => viewReview(sub)}>
                  View Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && selectedContent && (
        <div className="quiz-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedContent.mainTopic} - Quiz</h3>
              <button className="close-btn" onClick={() => setShowQuiz(false)}>✕</button>
            </div>
            
            <div className="quiz-questions">
              {selectedContent.questions.map((q, qIndex) => (
                <div key={qIndex} className="quiz-question">
                  <h4>Q{qIndex + 1}: {q.question}</h4>
                  <div className="quiz-options">
                    {q.options.map((option, oIndex) => (
                      <div 
                        key={oIndex}
                        className={`quiz-option ${answers[qIndex] === option ? 'selected' : ''}`}
                        onClick={() => {
                          const newAnswers = [...answers];
                          newAnswers[qIndex] = option;
                          setAnswers(newAnswers);
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${qIndex}`}
                          checked={answers[qIndex] === option}
                          onChange={() => {}}
                        />
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowQuiz(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={submitQuiz}>
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && selectedSubmission && (
        <div className="quiz-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Quiz Review</h3>
              <button className="close-btn" onClick={() => setShowReview(false)}>✕</button>
            </div>

            <div className="score-display">
              <h2>Your Score: {selectedSubmission.score}/{selectedSubmission.total}</h2>
              {selectedSubmission.isManuallyReviewed && (
                <p className="admin-feedback">👨‍🏫 Teacher's Note: {selectedSubmission.adminFeedback}</p>
              )}
            </div>

            <div className="review-questions">
              {selectedSubmission.answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`review-item ${answer.correct ? 'correct' : 'incorrect'}`}
                >
                  <h4>Q{index + 1}: {answer.question}</h4>
                  <p><strong>Your Answer:</strong> {answer.selected || "No answer"}</p>
                  <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
                  {answer.correct ? (
                    <span className="result-icon">✅ Correct</span>
                  ) : (
                    <span className="result-icon">❌ Incorrect</span>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="primary-btn" onClick={() => setShowReview(false)}>
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}