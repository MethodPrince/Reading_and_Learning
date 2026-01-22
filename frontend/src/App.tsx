import { useEffect, useState } from 'react';
import ReadingEngine from './assets/components/ReadingEngine';
import './App.css';

export default function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [grade, setGrade] = useState<string | null>(null); // null = welcome page

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.ok ? res.text() : Promise.reject('unavailable'))
      .then(text => setApiStatus(text))
      .catch(() => setApiStatus('unavailable'));
  }, []);

  if (!grade) {
    // Welcome & Grade Selection Page
    return (
      <div className="app-container">
        <h1>Welcome to the Reading & Learning Channel!</h1>
        <p>Backend API: {apiStatus}</p>

        <div className="centered-card">
          <h2>Select your grade to start:</h2>
          <select
            value=""
            onChange={e => setGrade(e.target.value)}
            className="grade-select"
          >
            <option value="" disabled>Select grade</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
          </select>
        </div>
      </div>
    );
  }

  // Reading Engine Page (after grade selection)
  return (
    <div className="app-container">
      <h1>Reading & Learning Channel</h1>
      <p>Backend API: {apiStatus}</p>

      <button
        onClick={() => setGrade(null)}
        className="change-grade-btn"
      >
        ⬅ Change Grade
      </button>

      <div style={{ marginTop: 20 }}>
        <ReadingEngine grade={grade} />
      </div>
    </div>
  );
}
