// api/generate-questions.js
// Enhanced Serverless Function with Topic-Specific Questions

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
    const { prompt, questionCount, difficulty, topic, genre, gameMode } = req.body;

    // Generate topic-specific questions
    const questions = generateTopicQuestions(
      prompt || topic,
      questionCount || 10,
      difficulty || 'medium',
      genre,
      gameMode === 'mini-game' // Add multiple choice options for mini-game
    );
    
    return res.status(200).json({
      content: [{ text: JSON.stringify(questions) }]
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
}

// Comprehensive question bank organized by topic
const questionDatabase = {
  history: {
    'Ancient Civilizations': [
      { q: "What year did the Roman Empire officially fall?", a: "476 AD", cat: "Ancient Rome" },
      { q: "Which pharaoh built the Great Pyramid of Giza?", a: "Khufu (Cheops)", cat: "Ancient Egypt" },
      { q: "What was the primary writing system of ancient Mesopotamia?", a: "Cuneiform", cat: "Mesopotamia" },
      { q: "Which ancient Greek city-state was known for its military prowess?", a: "Sparta", cat: "Ancient Greece" },
      { q: "What was the capital of the Aztec Empire?", a: "Tenochtitlan", cat: "Mesoamerica" }
    ],
    'World Wars': [
      { q: "In what year did World War I begin?", a: "1914", cat: "WWI" },
      { q: "What was the code name for the D-Day invasion?", a: "Operation Overlord", cat: "WWII" },
      { q: "Which battle is considered the turning point of WWII in Europe?", a: "Battle of Stalingrad", cat: "WWII" },
      { q: "What treaty officially ended World War I?", a: "Treaty of Versailles", cat: "WWI" },
      { q: "Who was the British Prime Minister for most of WWII?", a: "Winston Churchill", cat: "WWII" }
    ],
    'American History': [
      { q: "What year was the Declaration of Independence signed?", a: "1776", cat: "American Revolution" },
      { q: "Who was the first President of the United States?", a: "George Washington", cat: "Early America" },
      { q: "In what year did the American Civil War end?", a: "1865", cat: "Civil War" },
      { q: "What amendment abolished slavery in the United States?", a: "13th Amendment", cat: "Civil War" },
      { q: "Who assassinated President Abraham Lincoln?", a: "John Wilkes Booth", cat: "Civil War" }
    ]
  },
  science: {
    'Physics': [
      { q: "What is the speed of light in a vacuum?", a: "299,792,458 meters per second (approximately 300,000 km/s)", cat: "Physics" },
      { q: "Who formulated the theory of general relativity?", a: "Albert Einstein", cat: "Physics" },
      { q: "What is the smallest unit of matter that retains chemical properties?", a: "Atom", cat: "Physics" },
      { q: "What force keeps planets in orbit around the sun?", a: "Gravity", cat: "Physics" },
      { q: "What is the unit of electrical resistance?", a: "Ohm", cat: "Physics" }
    ],
    'Biology': [
      { q: "What is the powerhouse of the cell?", a: "Mitochondria", cat: "Cell Biology" },
      { q: "What is the process by which plants convert sunlight into energy?", a: "Photosynthesis", cat: "Biology" },
      { q: "What is the largest organ in the human body?", a: "Skin", cat: "Human Biology" },
      { q: "How many chromosomes do humans have?", a: "46 (23 pairs)", cat: "Genetics" },
      { q: "What is DNA short for?", a: "Deoxyribonucleic Acid", cat: "Genetics" }
    ],
    'Chemistry': [
      { q: "What is the chemical symbol for gold?", a: "Au", cat: "Chemistry" },
      { q: "What is the most abundant element in the universe?", a: "Hydrogen", cat: "Chemistry" },
      { q: "What is the pH of pure water?", a: "7 (neutral)", cat: "Chemistry" },
      { q: "What element has the atomic number 6?", a: "Carbon", cat: "Chemistry" },
      { q: "What is the chemical formula for table salt?", a: "NaCl (Sodium Chloride)", cat: "Chemistry" }
    ]
  },
  geography: {
    'Countries & Capitals': [
      { q: "What is the capital of France?", a: "Paris", cat: "European Capitals" },
      { q: "What is the largest country by land area?", a: "Russia", cat: "World Geography" },
      { q: "What is the capital of Australia?", a: "Canberra", cat: "Oceania" },
      { q: "Which country has the most time zones?", a: "France (12 time zones)", cat: "World Geography" },
      { q: "What is the smallest country in the world?", a: "Vatican City", cat: "World Geography" }
    ],
    'Landforms': [
      { q: "What is the tallest mountain in the world?", a: "Mount Everest", cat: "Mountains" },
      { q: "What is the longest river in the world?", a: "Nile River", cat: "Rivers" },
      { q: "What is the largest desert in the world?", a: "Antarctic Desert (or Sahara for hot deserts)", cat: "Deserts" },
      { q: "What is the deepest point in the ocean?", a: "Mariana Trench", cat: "Oceans" },
      { q: "Which continent has the most countries?", a: "Africa (54 countries)", cat: "Continents" }
    ]
  },
  entertainment: {
    'Movies': [
      { q: "Who directed the movie 'Titanic'?", a: "James Cameron", cat: "Movies" },
      { q: "What year was the first Star Wars movie released?", a: "1977", cat: "Movies" },
      { q: "Which movie won the Academy Award for Best Picture in 1994?", a: "Forrest Gump", cat: "Movies" },
      { q: "Who played Iron Man in the Marvel Cinematic Universe?", a: "Robert Downey Jr.", cat: "Movies" },
      { q: "What is the highest-grossing film of all time (unadjusted)?", a: "Avatar", cat: "Movies" }
    ],
    'Music': [
      { q: "Who is known as the 'King of Pop'?", a: "Michael Jackson", cat: "Music" },
      { q: "Which band released the album 'Abbey Road'?", a: "The Beatles", cat: "Music" },
      { q: "What year was Beethoven born?", a: "1770", cat: "Classical Music" },
      { q: "Who sang 'Bohemian Rhapsody'?", a: "Queen (Freddie Mercury)", cat: "Rock Music" },
      { q: "What instrument does Yo-Yo Ma play?", a: "Cello", cat: "Classical Music" }
    ]
  },
  sports: {
    'Football': [
      { q: "How many players are on a soccer/football team?", a: "11 players", cat: "Soccer/Football" },
      { q: "Which country has won the most FIFA World Cups?", a: "Brazil (5 titles)", cat: "Soccer/Football" },
      { q: "What is the maximum score in a single frame of bowling?", a: "30 points", cat: "Bowling" },
      { q: "In American football, how many points is a touchdown worth?", a: "6 points", cat: "American Football" },
      { q: "Which NFL team has won the most Super Bowls?", a: "New England Patriots and Pittsburgh Steelers (tied at 6)", cat: "American Football" }
    ],
    'Basketball': [
      { q: "Who holds the NBA record for most career points?", a: "LeBron James", cat: "Basketball" },
      { q: "How many players are on a basketball court per team?", a: "5 players", cat: "Basketball" },
      { q: "What is the diameter of a basketball hoop in inches?", a: "18 inches", cat: "Basketball" },
      { q: "Which team has won the most NBA championships?", a: "Boston Celtics (17 championships)", cat: "Basketball" },
      { q: "How long is an NBA basketball game (in minutes of play)?", a: "48 minutes (4 quarters of 12 minutes)", cat: "Basketball" }
    ],
    'Golf': [
      { q: "What is the term for one under par in golf?", a: "Birdie", cat: "Golf" },
      { q: "How many holes are in a standard round of golf?", a: "18 holes", cat: "Golf" },
      { q: "What is the term for hitting the ball into the hole in one shot?", a: "Hole-in-one (or Ace)", cat: "Golf" },
      { q: "Which tournament is known as 'The Masters'?", a: "Augusta National Golf Club annual tournament", cat: "Golf" },
      { q: "What is the maximum number of clubs allowed in a golf bag?", a: "14 clubs", cat: "Golf" }
    ]
  },
  technology: {
    'Computing': [
      { q: "What does CPU stand for?", a: "Central Processing Unit", cat: "Computing" },
      { q: "Who is considered the father of the computer?", a: "Charles Babbage", cat: "Computing History" },
      { q: "What year was the first iPhone released?", a: "2007", cat: "Technology" },
      { q: "What does HTML stand for?", a: "HyperText Markup Language", cat: "Web Development" },
      { q: "Who founded Microsoft?", a: "Bill Gates and Paul Allen", cat: "Technology" }
    ]
  }
};

// Generate questions based on topic
function generateTopicQuestions(topicInput, count, difficulty, genre, isMultipleChoice = false) {
  const questions = [];
  const topicLower = (topicInput || '').toLowerCase();
  
  // Find matching questions from database
  let relevantQuestions = [];
  
  // Search through all topics
  Object.keys(questionDatabase).forEach(mainTopic => {
    if (topicLower.includes(mainTopic) || mainTopic.includes(topicLower.split(' ')[0])) {
      Object.keys(questionDatabase[mainTopic]).forEach(subtopic => {
        if (!genre || subtopic.toLowerCase().includes(genre.toLowerCase()) || 
            topicLower.includes(subtopic.toLowerCase())) {
          relevantQuestions = relevantQuestions.concat(questionDatabase[mainTopic][subtopic]);
        }
      });
    }
  });
  
  // If no specific match, check all subtopics
  if (relevantQuestions.length === 0) {
    Object.values(questionDatabase).forEach(mainTopicData => {
      Object.values(mainTopicData).forEach(subtopicQuestions => {
        relevantQuestions = relevantQuestions.concat(subtopicQuestions);
      });
    });
  }
  
  // Shuffle questions
  relevantQuestions = shuffleArray(relevantQuestions);
  
  // Generate requested number of questions
  for (let i = 0; i < count; i++) {
    const baseQuestion = relevantQuestions[i % relevantQuestions.length];
    
    if (isMultipleChoice) {
      // Generate multiple choice options for mini-game
      const wrongAnswers = generateWrongAnswers(baseQuestion.a, baseQuestion.cat, relevantQuestions);
      const allOptions = shuffleArray([baseQuestion.a, ...wrongAnswers]);
      const correctIndex = allOptions.indexOf(baseQuestion.a);
      
      questions.push({
        question: baseQuestion.q,
        options: allOptions,
        correctAnswer: correctIndex,
        category: baseQuestion.cat
      });
    } else {
      // Regular format with answer
      questions.push({
        question: baseQuestion.q,
        answer: baseQuestion.a,
        category: baseQuestion.cat,
        difficulty: difficulty
      });
    }
  }
  
  return questions;
}

// Generate plausible wrong answers
function generateWrongAnswers(correctAnswer, category, questionPool) {
  const wrongAnswers = [];
  
  // Try to get similar answers from the same category
  const similarQuestions = questionPool.filter(q => 
    q.cat === category && q.a !== correctAnswer
  );
  
  // Add similar answers
  for (let i = 0; i < Math.min(2, similarQuestions.length); i++) {
    wrongAnswers.push(similarQuestions[i].a);
  }
  
  // Add generic plausible answers if needed
  const genericWrongAnswers = [
    "Alexander the Great",
    "Leonardo da Vinci",
    "Marie Curie",
    "Isaac Newton",
    "William Shakespeare",
    "Napoleon Bonaparte",
    "Cleopatra",
    "Julius Caesar",
    "Albert Einstein",
    "Charles Darwin",
    "The Pacific Ocean",
    "Mount Kilimanjaro",
    "The Amazon River",
    "Antarctica",
    "1776",
    "1945",
    "1914",
    "1492",
    "The Nile",
    "Rome",
    "Athens",
    "Cairo",
    "London"
  ];
  
  // Fill remaining slots with generic answers
  let attempts = 0;
  while (wrongAnswers.length < 3 && attempts < 50) {
    const randomAnswer = genericWrongAnswers[Math.floor(Math.random() * genericWrongAnswers.length)];
    if (randomAnswer !== correctAnswer && !wrongAnswers.includes(randomAnswer)) {
      wrongAnswers.push(randomAnswer);
    }
    attempts++;
  }
  
  // Ensure we have exactly 3 wrong answers
  while (wrongAnswers.length < 3) {
    wrongAnswers.push(`Option ${String.fromCharCode(65 + wrongAnswers.length)}`);
  }
  
  return wrongAnswers.slice(0, 3);
}

// Shuffle array helper
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/*
TO USE REAL AI (ANTHROPIC CLAUDE API):

1. Get API key from: https://console.anthropic.com/
2. Add to Vercel Environment Variables:
   - Name: ANTHROPIC_API_KEY
   - Value: sk-ant-api03-...

3. Replace the generateTopicQuestions function with this:

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
      content: `Generate ${questionCount} trivia questions about ${prompt}.
Difficulty: ${difficulty}
Topic: ${topic}
Genre: ${genre || 'general'}

Return ONLY a JSON array:
[
  {
    "question": "Question text?",
    "answer": "Answer text",
    "category": "Category",
    "difficulty": "${difficulty}"
  }
]`
    }]
  })
});

const data = await response.json();
return data;

*/
