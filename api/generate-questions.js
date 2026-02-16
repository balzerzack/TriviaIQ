// api/generate-questions.js
// Vercel Serverless Function

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, questionCount } = req.body;

    // For demo purposes without API key, return mock questions
    // In production, you would call the Anthropic API here with your API key
    
    const mockQuestions = generateMockQuestions(questionCount || 10);
    
    return res.status(200).json({
      content: [{ text: JSON.stringify(mockQuestions) }]
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
}

// Mock question generator (replace with real API call in production)
function generateMockQuestions(count) {
  const questions = [];
  const templates = [
    {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctAnswer: 1,
      category: "Geography"
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      correctAnswer: 2,
      category: "Art"
    },
    {
      question: "What year did World War II end?",
      options: ["1943", "1944", "1945", "1946"],
      correctAnswer: 2,
      category: "History"
    },
    {
      question: "What is the largest planet in our solar system?",
      options: ["Mars", "Saturn", "Jupiter", "Neptune"],
      correctAnswer: 2,
      category: "Science"
    },
    {
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: 1,
      category: "Literature"
    },
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
      category: "Science"
    },
    {
      question: "In which year did the Titanic sink?",
      options: ["1910", "1912", "1914", "1916"],
      correctAnswer: 1,
      category: "History"
    },
    {
      question: "What is the smallest country in the world?",
      options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
      correctAnswer: 1,
      category: "Geography"
    },
    {
      question: "Who painted 'The Starry Night'?",
      options: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Salvador Dalí"],
      correctAnswer: 1,
      category: "Art"
    },
    {
      question: "What is the speed of light?",
      options: ["299,792 km/s", "150,000 km/s", "450,000 km/s", "1,000,000 km/s"],
      correctAnswer: 0,
      category: "Science"
    }
  ];

  for (let i = 0; i < count; i++) {
    questions.push({ ...templates[i % templates.length] });
  }

  return questions;
}

/* 
TO USE REAL AI (ANTHROPIC CLAUDE API):

1. Get API key from: https://console.anthropic.com/
2. Add to Vercel Environment Variables:
   - Name: ANTHROPIC_API_KEY
   - Value: sk-ant-api03-...

3. Replace the generateMockQuestions function with this:

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })
});

const data = await response.json();
return data;

PRICING:
- Claude Sonnet: $3 per million input tokens, $15 per million output tokens
- Each trivia generation ~500 tokens = ~$0.01 per generation
- 100 generations = ~$1

*/
