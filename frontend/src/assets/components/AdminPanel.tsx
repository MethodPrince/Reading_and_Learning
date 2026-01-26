import { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";

type Question = {
  type: "mcq" | "truefalse" | "shortanswer";
  question: string;
  options: string[];
  answer: string;
};

type SubTopic = {
  name: string;
  description: string;
};

type ContentItem = {
  _id?: string;
  grade: string;
  subject: string;
  topic: string;
  subTopics: SubTopic[];
  description: string;
  questions: Question[];
  definitions?: { word: string; meaning: string }[];
  term?: string;
  mainTopic?: string;
};

export default function AdminPanel() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([
    { type: "mcq", question: "", options: ["", "", "", ""], answer: "" }
  ]);
  const [definitions, setDefinitions] = useState<{ word: string; meaning: string }[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([{ name: "", description: "" }]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    grade: "",
    subject: "",
    topic: "",
    description: "",
    term: "Term 1"
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/content");
      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error("Failed to load content:", error);
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
    if (errors.length > 0) setErrors([]);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { type: "mcq", question: "", options: ["", "", "", ""], answer: "" }
    ]);
  };

  const addDefinition = () => {
    setDefinitions([
      ...definitions,
      { word: "", meaning: "" }
    ]);
  };

  const addSubTopic = () => {
    setSubTopics([
      ...subTopics,
      { name: "", description: "" }
    ]);
  };

  const updateSubTopic = (index: number, key: keyof SubTopic, value: string) => {
    const copy = [...subTopics];
    copy[index][key] = value;
    setSubTopics(copy);
  };

  const removeSubTopic = (index: number) => {
    if (subTopics.length > 1) {
      const copy = subTopics.filter((_, i) => i !== index);
      setSubTopics(copy);
    }
  };

  const updateQuestion = (index: number, key: string, value: any) => {
    const copy = [...questions];
    (copy[index] as any)[key] = value;
    
    if (key === "type") {
      const newType = value as "mcq" | "truefalse" | "shortanswer";
      if (newType === "mcq") {
        copy[index].options = ["", "", "", ""];
        copy[index].answer = "";
      } else if (newType === "truefalse") {
        copy[index].options = ["True", "False"];
        copy[index].answer = "";
      } else if (newType === "shortanswer") {
        copy[index].options = [];
        copy[index].answer = "";
      }
    }
    
    setQuestions(copy);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const copy = [...questions];
    copy[qIndex].options[oIndex] = value;
    setQuestions(copy);
  };

  const updateDefinition = (index: number, key: "word" | "meaning", value: string) => {
    const copy = [...definitions];
    copy[index][key] = value;
    setDefinitions(copy);
  };

  const validateStep1 = (): boolean => {
    const newErrors: string[] = [];
    if (!form.grade.trim()) newErrors.push("Grade is required");
    if (!form.subject.trim()) newErrors.push("Subject is required");
    if (!form.topic.trim()) newErrors.push("Main Topic is required");
    
    // Validate subTopics
    subTopics.forEach((subTopic, index) => {
      if (!subTopic.name.trim()) newErrors.push(`Sub Topic ${index + 1}: Name is required`);
      if (!subTopic.description.trim()) newErrors.push(`Sub Topic ${index + 1}: Description is required`);
    });
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: string[] = [];
    definitions.forEach((def, index) => {
      if (!def.word.trim()) newErrors.push(`Term ${index + 1}: Word is required`);
      if (!def.meaning.trim()) newErrors.push(`Term ${index + 1}: Meaning is required`);
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: string[] = [];
    questions.forEach((q, qIndex) => {
      if (!q.question.trim()) newErrors.push(`Question ${qIndex + 1}: Question text is required`);
      
      if (q.type === "mcq") {
        q.options.forEach((option, oIndex) => {
          if (!option.trim()) newErrors.push(`Question ${qIndex + 1}: Option ${oIndex + 1} is required`);
        });
        if (!q.answer.trim()) newErrors.push(`Question ${qIndex + 1}: Select a correct answer`);
      } else if (q.type === "truefalse") {
        if (!q.answer.trim()) newErrors.push(`Question ${qIndex + 1}: Select True or False`);
      } else if (q.type === "shortanswer") {
        if (!q.answer.trim()) newErrors.push(`Question ${qIndex + 1}: Provide the correct answer`);
      }
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const goToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setErrors([]);
    }
  };

  const goToStep3 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      setErrors([]);
    }
  };

  const submit = async () => {
    if (!validateStep3()) return;

    const payload = {
      grade: form.grade,
      subject: form.subject,
      term: form.term,
      mainTopic: form.topic,
      subTopics: subTopics,
      description: form.description,
      definitions: definitions,
      questions: questions
    };

    const url = editingId
      ? `http://localhost:4000/api/admin/content/${editingId}`
      : "http://localhost:4000/api/admin/content";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        resetForm();
        await loadContent();
        alert(editingId ? "Content updated!" : "Content added!");
      }
    } catch (error) {
      alert("Error saving content");
    }
  };

  const resetForm = () => {
    setForm({
      grade: "",
      subject: "",
      topic: "",
      description: "",
      term: "Term 1"
    });
    setSubTopics([{ name: "", description: "" }]);
    setQuestions([{ type: "mcq", question: "", options: ["", "", "", ""], answer: "" }]);
    setDefinitions([]);
    setEditingId(null);
    setCurrentStep(1);
    setErrors([]);
  };

  const editContent = (item: ContentItem) => {
    setForm({
      grade: item.grade,
      subject: item.subject,
      topic: item.mainTopic || item.topic,
      description: item.description,
      term: item.term || "Term 1"
    });
    
    // Handle both old single subtopic and new array format
    if (Array.isArray(item.subTopics)) {
      setSubTopics(item.subTopics.length > 0 ? item.subTopics : [{ name: "", description: "" }]);
    } else {
      // Backward compatibility: convert single subtopic to array
      setSubTopics([{ 
        name: item.subTopic || "", 
        description: item.description || "" 
      }]);
    }
    
    setQuestions(item.questions || [{ type: "mcq", question: "", options: ["", "", "", ""], answer: "" }]);
    setDefinitions(item.definitions || []);
    setEditingId(item._id || null);
    setCurrentStep(1);
    setErrors([]);
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Delete this content?")) return;

    try {
      await fetch(`http://localhost:4000/api/admin/content/${id}`, {
        method: "DELETE"
      });
      await loadContent();
      alert("Deleted!");
    } catch (error) {
      alert("Error deleting");
    }
  };

  const renderQuestionInput = (q: Question, qIndex: number) => {
    switch (q.type) {
      case "mcq":
        return (
          <div className="mcq-options">
            <label>Options (Mark the correct one) *</label>
            {q.options.map((op, oi) => (
              <div key={oi} className="option-row">
                <input
                  type="text"
                  placeholder={`Option ${oi + 1}`}
                  value={op}
                  onChange={e => updateOption(qIndex, oi, e.target.value)}
                  className={errors.some(e => e.includes(`Question ${qIndex + 1}: Option ${oi + 1}`)) ? 'error' : ''}
                />
                <label>
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.answer === op}
                    onChange={() => updateQuestion(qIndex, "answer", op)}
                  />
                  Correct Answer
                </label>
              </div>
            ))}
          </div>
        );

      case "truefalse":
        return (
          <div className="truefalse-options">
            <label>Select the correct answer *</label>
            <div className="tf-buttons">
              <button
                type="button"
                className={`tf-btn ${q.answer === "True" ? 'selected' : ''}`}
                onClick={() => updateQuestion(qIndex, "answer", "True")}
              >
                True
              </button>
              <button
                type="button"
                className={`tf-btn ${q.answer === "False" ? 'selected' : ''}`}
                onClick={() => updateQuestion(qIndex, "answer", "False")}
              >
                False
              </button>
            </div>
            {errors.some(e => e.includes(`Question ${qIndex + 1}: Select True or False`)) && (
              <div className="error-text">Please select True or False</div>
            )}
          </div>
        );

      case "shortanswer":
        return (
          <div className="shortanswer-input">
            <label>Correct Answer *</label>
            <textarea
              placeholder="Enter the correct answer that students should type"
              value={q.answer}
              onChange={e => updateQuestion(qIndex, "answer", e.target.value)}
              rows={3}
              className={`form-textarea ${errors.some(e => e.includes(`Question ${qIndex + 1}: Provide the correct answer`)) ? 'error' : ''}`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-container">
      <h1>📚 Add Learning Content</h1>

      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <span>1</span>
          <p>Basic Info</p>
        </div>
        <div className="connector"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <span>2</span>
          <p>Definitions</p>
        </div>
        <div className="connector"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <span>3</span>
          <p>Questions</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="error-box">
          <h4>Please fix these errors:</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="step-container">
          <h3>Step 1: Basic Information</h3>
          
          <div className="form-group">
            <label>Grade *</label>
            <select 
              value={form.grade} 
              onChange={e => updateForm("grade", e.target.value)}
              className={errors.some(e => e.includes("Grade")) ? 'error' : ''}
            >
              <option value="">Select Grade</option>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i} value={`Grade ${i + 4}`}>Grade {i + 4}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <input 
              type="text"
              placeholder="e.g., Life Orientation, Mathematics"
              value={form.subject}
              onChange={e => updateForm("subject", e.target.value)}
              className={errors.some(e => e.includes("Subject")) ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label>Term</label>
            <select 
              value={form.term} 
              onChange={e => updateForm("term", e.target.value)}
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
              <option value="Term 4">Term 4</option>
            </select>
          </div>

          <div className="form-group">
            <label>Main Topic *</label>
            <input 
              type="text"
              placeholder="e.g., Personal Development"
              value={form.topic}
              onChange={e => updateForm("topic", e.target.value)}
              className={errors.some(e => e.includes("Main Topic")) ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label>Topic Description</label>
            <textarea 
              placeholder="Describe the main topic..."
              value={form.description}
              onChange={e => updateForm("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="subtopics-section">
            <div className="section-header">
              <h4>Sub Topics *</h4>
              <p className="section-description">Add one or more sub-topics under the main topic</p>
            </div>
            
            <div className="subtopics-list">
              {subTopics.map((subTopic, index) => (
                <div key={index} className="subtopic-item">
                  <div className="subtopic-header">
                    <span>Sub Topic #{index + 1}</span>
                    {subTopics.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-btn"
                        onClick={() => removeSubTopic(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Sub Topic Name *"
                    value={subTopic.name}
                    onChange={e => updateSubTopic(index, "name", e.target.value)}
                    className={errors.some(e => e.includes(`Sub Topic ${index + 1}: Name`)) ? 'error' : ''}
                  />
                  
                  <textarea
                    placeholder="Sub Topic Description *"
                    value={subTopic.description}
                    onChange={e => updateSubTopic(index, "description", e.target.value)}
                    rows={2}
                    className={errors.some(e => e.includes(`Sub Topic ${index + 1}: Description`)) ? 'error' : ''}
                  />
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              className="add-btn"
              onClick={addSubTopic}
            >
              + Add Another Sub Topic
            </button>
          </div>

          <button 
            className="next-btn"
            onClick={goToStep2}
          >
            Next: Add Definitions →
          </button>
        </div>
      )}

      {/* Step 2: Definitions */}
      {currentStep === 2 && (
        <div className="step-container">
          <h3>Step 2: Key Terms & Definitions</h3>
          
          <div className="definitions-list">
            {definitions.map((def, index) => (
              <div key={index} className="definition-item">
                <div className="definition-header">
                  <span>Term #{index + 1}</span>
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => {
                      const newDefs = definitions.filter((_, i) => i !== index);
                      setDefinitions(newDefs);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Word or Term *"
                  value={def.word}
                  onChange={e => updateDefinition(index, "word", e.target.value)}
                  className={errors.some(e => e.includes(`Term ${index + 1}: Word`)) ? 'error' : ''}
                />
                <textarea
                  placeholder="Definition *"
                  value={def.meaning}
                  onChange={e => updateDefinition(index, "meaning", e.target.value)}
                  rows={2}
                  className={errors.some(e => e.includes(`Term ${index + 1}: Meaning`)) ? 'error' : ''}
                />
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="add-btn"
            onClick={addDefinition}
          >
            + Add Another Term
          </button>

          <div className="step-buttons">
            <button className="back-btn" onClick={() => setCurrentStep(1)}>
              ← Back to Basic Info
            </button>
            <button className="next-btn" onClick={goToStep3}>
              Next: Add Questions →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Questions */}
      {currentStep === 3 && (
        <div className="step-container">
          <h3>Step 3: Practice Questions</h3>
          
          <div className="questions-list">
            {questions.map((q, qi) => (
              <div key={qi} className="question-item">
                <div className="question-header">
                  <h4>Question {qi + 1}</h4>
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => {
                      const newQuestions = questions.filter((_, i) => i !== qi);
                      setQuestions(newQuestions);
                    }}
                  >
                    Remove Question
                  </button>
                </div>

                <div className="question-type-selector">
                  <label>Question Type:</label>
                  <div className="type-buttons">
                    <button
                      type="button"
                      className={`type-btn ${q.type === "mcq" ? 'selected' : ''}`}
                      onClick={() => updateQuestion(qi, "type", "mcq")}
                    >
                      Multiple Choice
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${q.type === "truefalse" ? 'selected' : ''}`}
                      onClick={() => updateQuestion(qi, "type", "truefalse")}
                    >
                      True/False
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${q.type === "shortanswer" ? 'selected' : ''}`}
                      onClick={() => updateQuestion(qi, "type", "shortanswer")}
                    >
                      Short Answer
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    placeholder="Enter the question..."
                    value={q.question}
                    onChange={e => updateQuestion(qi, "question", e.target.value)}
                    rows={2}
                    className={errors.some(e => e.includes(`Question ${qi + 1}: Question text`)) ? 'error' : ''}
                  />
                </div>

                {renderQuestionInput(q, qi)}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            className="add-btn"
            onClick={addQuestion}
          >
            + Add Another Question
          </button>

          <div className="step-buttons">
            <button className="back-btn" onClick={() => setCurrentStep(2)}>
              ← Back to Definitions
            </button>
            <button className="save-btn" onClick={submit}>
              ✅ Save Content
            </button>
          </div>
        </div>
      )}

      <div className="content-list">
        <h3>Existing Content ({content.length})</h3>
        
        <div className="content-items">
          {content.map((item, i) => {
            // Handle both old single subtopic and new array format
            const subTopicsList = Array.isArray(item.subTopics) 
              ? item.subTopics 
              : [{ name: item.subTopic || "No subtopic", description: "" }];
              
            return (
              <div key={item._id || i} className="content-card">
                <div className="card-header">
                  <span className="grade-badge">{item.grade}</span>
                  <span className="subject-badge">{item.subject}</span>
                  <span className="topic-badge">{item.mainTopic || item.topic}</span>
                </div>
                
                <h4>{subTopicsList[0]?.name || "No Sub Topic"}</h4>
                {subTopicsList.length > 1 && (
                  <div className="subtopics-count">
                    <span className="subtopics-badge">+{subTopicsList.length - 1} more subtopics</span>
                  </div>
                )}
                
                <p className="description">{item.description?.substring(0, 80)}...</p>
                
                <div className="card-stats">
                  <span>📚 {(item.definitions || []).length} terms</span>
                  <span>📝 {subTopicsList.length} subtopics</span>
                  <span>❓ {(item.questions || []).length} questions</span>
                </div>
                
                <div className="card-actions">
                  <button onClick={() => editContent(item)}>Edit</button>
                  <button onClick={() => deleteContent(item._id!)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}