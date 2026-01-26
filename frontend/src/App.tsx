import { useState } from 'react';
import ReadingEngine from './assets/components/ReadingEngine';
import AdminPanel from './assets/components/AdminPanel';
import './App.css';

export default function App() {
  const [mode, setMode] = useState<'student' | 'admin' | 'reading'>('student');
  const [selectedGrade, setSelectedGrade] = useState<string>('');

  // Student mode - Grade selection
  if (mode === 'student') {
    return (
      <div className="page">
        <div className="hero-section">
          <h1>🎓 School Learning System</h1>
          <p className="subtitle">Interactive Learning Platform for Grades 4-12</p>
          
          <div className="features">
            <div className="feature">
              <div className="feature-icon">📚</div>
              <h3>Study Notes</h3>
              <p>Access comprehensive learning materials</p>
            </div>
            <div className="feature">
              <div className="feature-icon">❓</div>
              <h3>Practice Quizzes</h3>
              <p>Test your knowledge with interactive questions</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor your learning journey</p>
            </div>
          </div>

          <div className="grade-selection">
            <h2>Select Your Grade to Begin</h2>
            <select 
              onChange={e => setSelectedGrade(e.target.value)} 
              value={selectedGrade}
            >
              <option value="" disabled>Choose Grade</option>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i} value={`Grade ${i + 4}`}>
                  Grade {i + 4}
                </option>
              ))}
            </select>
            <p className="hint">Grades 4 through 12 available</p>
            
            {selectedGrade && (
              <button 
                className="start-learning-btn"
                onClick={() => setMode('reading')}
              >
                Start Learning in {selectedGrade}
              </button>
            )}
          </div>

          <div className="admin-link">
            <p>Are you a teacher or administrator?</p>
            <button onClick={() => setMode('admin')}>
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin mode
  if (mode === 'admin') {
    return (
      <div className="admin-mode">
        <div className="admin-header-bar">
          <h1>🏫 School Learning System - Admin Panel</h1>
          <button onClick={() => setMode('student')} className="back-to-student-btn">
            ← Back to Student View
          </button>
        </div>
        <AdminPanel />
      </div>
    );
  }

  // Reading/Learning mode
  return (
    <div className="reading-mode">
      <div className="reading-header">
        <button onClick={() => setMode('student')} className="back-btn">
          ← Back to Grade Selection
        </button>
        <h1>🎓 {selectedGrade} Learning</h1>
      </div>
      <ReadingEngine selectedGrade={selectedGrade} />
    </div>
  );
}