import { useEffect, useState } from 'react';

type Question = {
  question: string;
  options: string[];
  answer: string;
};

type Passage = {
  id: number;
  grade: string;
  title: string;
  passage: string;
  questions: Question[];
};

type ReadingEngineProps = {
  grade: string;
};

export default function ReadingEngine({ grade }: ReadingEngineProps) {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/passages')
      .then(res => res.json())
      .then(data => setPassages(data));
  }, []);

  const checkAnswer = (key: string, selected: string, correct: string) => {
    setFeedback(prev => ({ ...prev, [key]: selected === correct }));
  };

  const filteredPassages = passages.filter(p => p.grade === grade);

  return (
    <div>
      <h2>Reading Practice - {grade}</h2>

      {filteredPassages.map(passage => (
        <div key={passage.id} style={{ marginTop: 30 }}>
          <h3>{passage.title}</h3>
          <p>{passage.passage}</p>

          {passage.questions.map((q, index) => {
            const key = `${passage.id}-${index}`;
            return (
              <div key={key} style={{ marginTop: 15 }}>
                <p>{q.question}</p>

                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => checkAnswer(key, opt, q.answer)}
                    style={{ display: 'block', marginTop: 5 }}
                  >
                    {opt}
                  </button>
                ))}

                {key in feedback && (
                  <p>{feedback[key] ? '✅ Correct!' : '❌ Incorrect'}</p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
