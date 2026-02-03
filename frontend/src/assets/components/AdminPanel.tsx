import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";

type User = {
  id: string;
  name: string;
  email: string;
  grade: string;
  maxAttempts: number;
  attemptsUsed: number;
};

type Submission = {
  _id: string;
  studentId: User;
  contentId: {
    _id: string;
    mainTopic: string;
    subject: string;
  };
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

type Content = {
  _id: string;
  grade: string;
  subject: string;
  mainTopic: string;
  description: string;
  questions: Array<any>;
  definitions: Array<any>;
  subTopics: Array<any>;
};

export default function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'content' | 'users'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editingAttempts, setEditingAttempts] = useState<{ [key: string]: number }>({});
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [manualScore, setManualScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    
    if (activeTab === 'submissions') {
      const res = await fetch("http://localhost:4000/api/admin/submissions", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubmissions(data);
    } else if (activeTab === 'users') {
      // Load users (you need to create this endpoint)
      // const res = await fetch("/api/admin/users", { headers });
      // const data = await res.json();
      // setUsers(data);
    }
  };

  const handleManualReview = async (submissionId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/admin/submissions/${submissionId}/review`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        score: manualScore,
        feedback
      }),
    });

    if (res.ok) {
      alert("Review submitted successfully");
      setReviewingSubmission(null);
      loadData();
    }
  };

  const updateUserAttempts = async (userId: string, maxAttempts: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:4000/api/admin/users/${userId}/attempts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ maxAttempts }),
    });

    if (res.ok) {
      alert("Max attempts updated");
      loadData();
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>👨‍🏫 Admin Dashboard</h1>
          <p>Welcome back, {user.name}</p>
        </div>
        <div className="admin-actions">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          📝 Student Submissions
        </button>
        <button 
          className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📚 Manage Content
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Manage Users
        </button>
      </div>

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="tab-content">
          <h3>Student Quiz Submissions ({submissions.length})</h3>
          
          <div className="submissions-grid">
            {submissions.map((sub) => (
              <div key={sub._id} className="submission-card">
                <div className="submission-header">
                  <div className="student-info">
                    <div className="student-avatar">
                      {sub.studentId.name.charAt(0)}
                    </div>
                    <div>
                      <h4>{sub.studentId.name}</h4>
                      <p>{sub.studentId.email} • {sub.studentId.grade}</p>
                    </div>
                  </div>
                  <div className={`score-badge ${sub.score >= sub.total * 0.7 ? 'good' : 'bad'}`}>
                    {sub.score}/{sub.total}
                  </div>
                </div>

                <div className="submission-details">
                  <p><strong>Topic:</strong> {sub.contentId.mainTopic}</p>
                  <p><strong>Submitted:</strong> {new Date(sub.submittedAt).toLocaleString()}</p>
                  {sub.isManuallyReviewed && (
                    <p className="reviewed-badge">✅ Manually Reviewed</p>
                  )}
                </div>

                <div className="submission-actions">
                  <button 
                    className="view-btn"
                    onClick={() => setSelectedSubmission(sub)}
                  >
                    View Answers
                  </button>
                  <button 
                    className="review-btn"
                    onClick={() => {
                      setReviewingSubmission(sub);
                      setManualScore(sub.score);
                      setFeedback(sub.adminFeedback || "");
                    }}
                  >
                    {sub.isManuallyReviewed ? 'Edit Review' : 'Manual Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Management Tab */}
      {activeTab === 'content' && (
        <div className="tab-content">
          <h3>Manage Learning Content</h3>
          <button className="primary-btn" onClick={() => alert('Content form will open here')}>
            + Add New Content
          </button>
          
          <div className="content-list">
            {/* Content items will be displayed here */}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <h3>Manage Students</h3>
          
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Attempts Used</th>
                  <th>Max Attempts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar-small">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <small>{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.grade}</td>
                    <td>{u.attemptsUsed}</td>
                    <td>
                      <input
                        type="number"
                        value={editingAttempts[u.id] || u.maxAttempts}
                        onChange={(e) => setEditingAttempts({
                          ...editingAttempts,
                          [u.id]: parseInt(e.target.value)
                        })}
                        min="1"
                        max="10"
                      />
                    </td>
                    <td>
                      <button 
                        className="save-btn"
                        onClick={() => updateUserAttempts(u.id, editingAttempts[u.id] || u.maxAttempts)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="modal">
          <div className="modal-content">
            <h3>Submission Details</h3>
            
            <div className="student-info-modal">
              <div className="student-avatar-large">
                {selectedSubmission.studentId.name.charAt(0)}
              </div>
              <div>
                <h4>{selectedSubmission.studentId.name}</h4>
                <p>{selectedSubmission.studentId.email} • {selectedSubmission.studentId.grade}</p>
                <p>Score: {selectedSubmission.score}/{selectedSubmission.total}</p>
              </div>
            </div>

            <div className="answers-review">
              {selectedSubmission.answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`answer-item ${answer.correct ? 'correct' : 'incorrect'}`}
                >
                  <p><strong>Q{index + 1}:</strong> {answer.question}</p>
                  <p><strong>Student's Answer:</strong> {answer.selected || "No answer"}</p>
                  <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
                  <p className={`status ${answer.correct ? 'correct-text' : 'incorrect-text'}`}>
                    {answer.correct ? '✅ Correct' : '❌ Incorrect'}
                  </p>
                </div>
              ))}
            </div>

            <button className="close-btn" onClick={() => setSelectedSubmission(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manual Review Modal */}
      {reviewingSubmission && (
        <div className="modal">
          <div className="modal-content">
            <h3>Manual Review & Correction</h3>
            
            <div className="review-form">
              <div className="form-group">
                <label>Score (0-{reviewingSubmission.total})</label>
                <input
                  type="number"
                  value={manualScore}
                  onChange={(e) => setManualScore(parseInt(e.target.value))}
                  min="0"
                  max={reviewingSubmission.total}
                />
              </div>

              <div className="form-group">
                <label>Feedback for Student</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Add comments, corrections, or encouragement..."
                />
              </div>

              <div className="answers-to-correct">
                <h4>Review Individual Answers</h4>
                {reviewingSubmission.answers.map((answer, index) => (
                  <div key={index} className="answer-review-item">
                    <p><strong>Q{index + 1}:</strong> {answer.question}</p>
                    <div className="answer-comparison">
                      <span className="student-answer">
                        Student: {answer.selected}
                      </span>
                      <span className="correct-answer">
                        Correct: {answer.correctAnswer}
                      </span>
                    </div>
                    <label className="toggle-correct">
                      <input
                        type="checkbox"
                        defaultChecked={answer.correct}
                        onChange={(e) => {
                          // Update correctness logic here
                        }}
                      />
                      Mark as Correct
                    </label>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="secondary-btn" onClick={() => setReviewingSubmission(null)}>
                  Cancel
                </button>
                <button 
                  className="primary-btn"
                  onClick={() => handleManualReview(reviewingSubmission._id)}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}