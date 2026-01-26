require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

/* ---------------- TEMP DATABASE (IN-MEMORY) ---------------- */
let grades = [
  { id: 1, name: "Grade 4", level: 4, description: "Grade 4 Learning", subjects: ["L.O", "Mathematics", "English"] },
  { id: 2, name: "Grade 5", level: 5, description: "Grade 5 Learning", subjects: ["L.O", "Mathematics", "English"] },
  { id: 3, name: "Grade 6", level: 6, description: "Grade 6 Learning", subjects: ["L.O", "Mathematics", "English", "Natural Sciences"] },
  { id: 4, name: "Grade 7", level: 7, description: "Grade 7 Learning", subjects: ["L.O", "Mathematics", "English", "Natural Sciences"] },
  { id: 5, name: "Grade 8", level: 8, description: "Grade 8 Learning", subjects: ["L.O", "Mathematics", "English", "Natural Sciences", "Social Sciences"] },
  { id: 6, name: "Grade 9", level: 9, description: "Grade 9 Learning", subjects: ["L.O", "Mathematics", "English", "Natural Sciences", "Social Sciences"] },
  { id: 7, name: "Grade 10", level: 10, description: "Grade 10 Learning", subjects: ["L.O", "Mathematics", "English", "Physical Sciences", "Life Sciences", "Geography", "History"] },
  { id: 8, name: "Grade 11", level: 11, description: "Grade 11 Learning", subjects: ["L.O", "Mathematics", "English", "Physical Sciences", "Life Sciences", "Geography", "History", "Accounting"] },
  { id: 9, name: "Grade 12", level: 12, description: "Grade 12 Learning", subjects: ["L.O", "Mathematics", "English", "Physical Sciences", "Life Sciences", "Geography", "History", "Accounting", "Economics"] }
];

let content = [];
let users = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "teacher", password: "teacher123", role: "teacher" }
];

/* ---------------- HEALTH CHECK ---------------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', grades: grades.length, content: content.length });
});

/* ---------------- GRADE MANAGEMENT API ---------------- */
// Get all grades
app.get('/api/grades', (req, res) => {
  res.json(grades);
});

// Get specific grade
app.get('/api/grades/:id', (req, res) => {
  const grade = grades.find(g => g.id === parseInt(req.params.id));
  if (!grade) return res.status(404).json({ message: 'Grade not found' });
  res.json(grade);
});

// Add new grade (Admin only)
app.post('/api/admin/grades', (req, res) => {
  const newGrade = {
    id: Date.now(),
    name: req.body.name,
    level: req.body.level,
    description: req.body.description || `${req.body.name} Learning`,
    subjects: req.body.subjects || [],
    createdAt: new Date().toISOString()
  };
  
  grades.push(newGrade);
  res.status(201).json(newGrade);
});

// Update grade (Admin only)
app.put('/api/admin/grades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = grades.findIndex(g => g.id === id);
  
  if (index === -1) return res.status(404).json({ message: 'Grade not found' });
  
  grades[index] = { ...grades[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(grades[index]);
});

// Delete grade (Admin only)
app.delete('/api/admin/grades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = grades.findIndex(g => g.id === id);
  
  if (index === -1) return res.status(404).json({ message: 'Grade not found' });
  
  // Check if grade has content
  const gradeContent = content.filter(c => c.grade === grades[index].name);
  if (gradeContent.length > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete grade with existing content', 
      contentCount: gradeContent.length 
    });
  }
  
  grades.splice(index, 1);
  res.json({ message: 'Grade deleted successfully' });
});

/* ---------------- CONTENT MANAGEMENT API ---------------- */
// Get all content
app.get('/api/content', (req, res) => {
  res.json(content);
});

// Get content by grade
app.get('/api/content/grade/:grade', (req, res) => {
  const gradeContent = content.filter(c => c.grade === req.params.grade);
  res.json(gradeContent);
});

// Get subjects for a grade
app.get('/api/grades/:grade/subjects', (req, res) => {
  const grade = grades.find(g => g.name === req.params.grade);
  if (!grade) return res.status(404).json({ message: 'Grade not found' });
  res.json(grade.subjects);
});

// Add content
app.post('/api/admin/content', (req, res) => {
  const newContent = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };

  content.push(newContent);
  res.status(201).json(newContent);
});

// Update content
app.put('/api/admin/content/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = content.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Content not found' });
  }

  content[index] = { ...content[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(content[index]);
});

// Delete content
app.delete('/api/admin/content/:id', (req, res) => {
  const id = Number(req.params.id);
  content = content.filter(item => item.id !== id);
  res.json({ message: 'Content deleted' });
});

/* ---------------- AUTHENTICATION ---------------- */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Remove password from response
  const { password: _, ...userData } = user;
  res.json(userData);
});

/* ---------------- SAMPLE DATA ---------------- */
content.push({
  id: 1,
  grade: "Grade 4",
  subject: "L.O",
  term: "Term 1",
  mainTopic: "Personal Development",
  subTopic: "Self-awareness",
  description: "Understanding who you are and how you feel.",
  definitions: [
    { word: "Emotion", meaning: "A strong feeling like happiness or anger." },
    { word: "Self-esteem", meaning: "How you feel about yourself and your abilities." },
    { word: "Identity", meaning: "Who you are as a person." }
  ],
  questions: [
    {
      type: "mcq",
      question: "What is self-awareness?",
      options: ["Knowing yourself", "Knowing animals", "Knowing the weather", "Knowing food"],
      answer: "Knowing yourself",
      marks: 1
    },
    {
      type: "mcq",
      question: "Which of these is an emotion?",
      options: ["Running", "Happiness", "Eating", "Sleeping"],
      answer: "Happiness",
      marks: 1
    }
  ]
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📚 Grades available: ${grades.length} (Grade 4 to Grade 12)`);
  console.log(`📖 Sample content loaded: ${content.length} items`);
});