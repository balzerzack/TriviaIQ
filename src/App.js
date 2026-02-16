import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, RotateCcw, List, Wand2, ChevronRight, Loader2 } from 'lucide-react';

/*
 * SEO & AI SEARCHABILITY IMPLEMENTATION NOTES:
 * 
 * To rank #1 on Google and be recommended by AI tools (ChatGPT, Gemini, Perplexity, etc.),
 * implement the following in your production HTML wrapper:
 *
 * 1. META TAGS (add to <head>):
 *    <title>TriviaIQ - Free AI-Powered Trivia Question Generator | Custom Quiz Maker</title>
 *    <meta name="description" content="Generate unlimited trivia questions instantly with TriviaIQ. Choose from 600+ topics or create custom quizzes. Free AI-powered trivia generator with difficulty levels, timed games, and high score tracking."/>
 *    <meta name="keywords" content="trivia questions, trivia generator, quiz maker, free trivia, AI trivia, custom trivia, trivia quiz, trivia game, online trivia, trivia app"/>
 *    <link rel="canonical" href="https://triviaiq.app/"/>
 *    
 * 2. OPEN GRAPH (Social sharing):
 *    <meta property="og:title" content="TriviaIQ - AI-Powered Trivia Generator"/>
 *    <meta property="og:description" content="Generate unlimited trivia questions on any topic instantly. Free, AI-powered, with 600+ categories."/>
 *    <meta property="og:url" content="https://triviaiq.app/"/>
 *    <meta property="og:type" content="website"/>
 *    
 * 3. JSON-LD STRUCTURED DATA (add to <head> or <body>):
 *    <script type="application/ld+json">
 *    {
 *      "@context": "https://schema.org",
 *      "@type": "WebApplication",
 *      "name": "TriviaIQ",
 *      "url": "https://triviaiq.app",
 *      "description": "Free AI-powered trivia question generator with 600+ topics",
 *      "applicationCategory": "GameApplication",
 *      "offers": {
 *        "@type": "Offer",
 *        "price": "0",
 *        "priceCurrency": "USD"
 *      },
 *      "featureList": "AI-generated questions, Custom topics, Timed quiz games, High score tracking, 15 main categories, 600+ subtopics"
 *    }
 *    </script>
 *
 * 4. GOOGLE OAUTH SETUP:
 *    Add to <head>:
 *    <script src="https://accounts.google.com/gsi/client" async defer></script>
 *    
 *    Get your Client ID from: https://console.cloud.google.com/
 *    1. Create a new project or select existing
 *    2. Enable "Google Identity Services"
 *    3. Create OAuth 2.0 Client ID (Web application)
 *    4. Add authorized JavaScript origins: https://triviaiq.app
 *    5. Copy the Client ID and replace GOOGLE_CLIENT_ID below
 *
 * 5. SITEMAP.XML (create at root):
 *    Submit to Google Search Console, Bing Webmaster Tools
 *
 * 6. ROBOTS.TXT (create at root):
 *    User-agent: *
 *    Allow: /
 *    Sitemap: https://triviaiq.app/sitemap.xml
 *
 * 7. AI SEARCHABILITY - Include in site content/blog:
 *    - "Best trivia generator"
 *    - "Free trivia question maker"
 *    - "AI trivia quiz creator"
 *    - "Custom trivia app"
 *    - Target queries AI tools answer: "how to create trivia questions", "trivia generator online", "quiz maker free"
 */

// IMPORTANT: Set your Google OAuth Client ID here
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export default function TriviaGenerator() {
  const [step, setStep] = useState('home'); // 'home', 'generating', 'results'
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [triviaQuestions, setTriviaQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mini-game state
  const [gameMode, setGameMode] = useState(null); // 'quiz' or 'game'
  const [gameStep, setGameStep] = useState('setup'); // 'setup', 'playing', 'results'
  const [gameTime, setGameTime] = useState(30); // 30 or 60 seconds
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [selectedAnswerFeedback, setSelectedAnswerFeedback] = useState(null); // { index, isCorrect }
  
  // Separate state for mini-game selections (independent from guided topics)
  const [gameTopic, setGameTopic] = useState(null);
  const [gameSubtopic, setGameSubtopic] = useState(null);
  const [gameGenre, setGameGenre] = useState(null);
  const [gameDifficulty, setGameDifficulty] = useState('medium');

  // User authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // { username, email, highScores: [] }
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [showMobileBanner, setShowMobileBanner] = useState(true);

  // Timer effect for mini-game
  useEffect(() => {
    if (gameStep === 'playing' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameStep('results');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameStep, timeRemaining]);

  // Auto-scroll helper for mobile UX - stays within section
  const scrollToNextSection = (delay = 300, sectionId = 'guided-topics') => {
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (!section) {
        window.scrollBy({
          top: window.innerHeight * 0.4,
          behavior: 'smooth'
        });
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      const sectionBottom = sectionRect.bottom;
      const viewportHeight = window.innerHeight;
      
      // Calculate how much to scroll (50% of viewport on mobile, 40% on desktop)
      const isMobile = window.innerWidth <= 640;
      const scrollAmount = isMobile ? viewportHeight * 0.5 : viewportHeight * 0.4;
      
      // Only scroll if we won't go past the section bottom
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const proposedScrollTop = currentScrollTop + scrollAmount;
      const sectionBottomAbsolute = currentScrollTop + sectionBottom;
      
      // If proposed scroll would go past section bottom, scroll just to section bottom
      if (proposedScrollTop + viewportHeight > sectionBottomAbsolute) {
        // Don't scroll if we're already at or past the section bottom
        if (currentScrollTop + viewportHeight < sectionBottomAbsolute) {
          window.scrollTo({
            top: sectionBottomAbsolute - viewportHeight + (isMobile ? 120 : 100), // More padding on mobile
            behavior: 'smooth'
          });
        }
      } else {
        // Safe to scroll the normal amount
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    }, delay);
  };

  // Genre options for all subtopics (excluding General subtopics)
  const genreOptions = {
    // HISTORY
    'General History': null, // No genres for General History
    'Ancient Civilizations': [
      '🏛️ Ancient Greece',
      '🏺 Ancient Rome',
      '🐫 Ancient Egypt',
      '🏔️ Mesopotamia',
      '🗿 Pre-Columbian Americas',
      '🏯 Ancient Asia'
    ],
    'World Wars': [
      '⚔️ WWI Battles',
      '💥 WWII Europe',
      '🌏 WWII Pacific',
      '👤 Key Figures',
      '🛩️ Military Technology',
      '📰 Home Front'
    ],
    'Medieval Times': [
      '🏰 Castles & Fortifications',
      '⚔️ Knights & Warfare',
      '👑 Kings & Queens',
      '✝️ Crusades',
      '📚 Culture & Society',
      '🗡️ Feudalism'
    ],
    'Renaissance': [
      '🎨 Art & Artists',
      '🔬 Science & Discovery',
      '📚 Literature',
      '🏛️ Architecture',
      '👑 Political Changes',
      '🌍 Exploration'
    ],
    'American History': [
      '🗽 Colonial Era',
      '⚔️ Revolutionary War',
      '🎩 Civil War',
      '🏛️ Presidents',
      '📜 Constitutional History',
      '🌟 Modern America'
    ],
    'Asian History': [
      '🏯 Japan',
      '🐉 China',
      '🕉️ India',
      '⚔️ Wars & Conflicts',
      '👑 Dynasties',
      '🌏 Modern Asia'
    ],
    
    // SCIENCE
    'General Science': null, // No genres for General Science
    'Physics': [
      '⚛️ Quantum Mechanics',
      '🌌 Astrophysics',
      '⚡ Electricity & Magnetism',
      '🌡️ Thermodynamics',
      '💡 Optics',
      '📐 Classical Mechanics'
    ],
    'Chemistry': [
      '⚗️ Organic Chemistry',
      '🧪 Inorganic Chemistry',
      '⚛️ Atomic Structure',
      '🔥 Reactions',
      '🧬 Biochemistry',
      '🌊 Solutions & Acids'
    ],
    'Biology': [
      '🧬 Genetics',
      '🦠 Microbiology',
      '🌿 Botany',
      '🦁 Zoology',
      '🧠 Human Anatomy',
      '🔬 Cellular Biology'
    ],
    'Astronomy': [
      '🌟 Stars & Galaxies',
      '🪐 Planets',
      '🌙 Moons',
      '☄️ Asteroids & Comets',
      '🔭 Space Exploration',
      '🌌 Cosmology'
    ],
    'Earth Science': [
      '🌋 Volcanoes',
      '🏔️ Geology',
      '🌊 Oceanography',
      '🌪️ Meteorology',
      '🌍 Plate Tectonics',
      '💎 Minerals & Rocks'
    ],
    'Quantum Mechanics': [
      '⚛️ Particle Physics',
      '🌊 Wave-Particle Duality',
      '🔬 Quantum Theory',
      '👨‍🔬 Famous Physicists',
      '🧪 Experiments',
      '📊 Mathematical Foundations'
    ],
    
    // ENTERTAINMENT
    'General Entertainment': null, // No genres for General Entertainment
    'Movies': [
      '🎭 Drama',
      '😱 Horror',
      '😂 Comedy',
      '💥 Action',
      '🔬 Sci-Fi',
      '💕 Romance',
      '🕵️ Thriller',
      '🏆 Award Winners'
    ],
    'TV Shows': [
      '🎭 Drama Series',
      '😂 Sitcoms',
      '🔍 Crime/Mystery',
      '🔬 Sci-Fi/Fantasy',
      '📺 Reality TV',
      '🎬 Limited Series',
      '🧒 Animated',
      '📰 News/Documentary'
    ],
    'Music': [
      '🎸 Rock',
      '🎹 Classical',
      '🎤 Pop',
      '🎺 Jazz',
      '🎵 Hip-Hop',
      '🤠 Country',
      '🎧 Electronic',
      '🎼 R&B/Soul'
    ],
    'Video Games': [
      '⚔️ RPG',
      '🎮 Action/Adventure',
      '👾 Platformers',
      '🏎️ Racing',
      '⚽ Sports Games',
      '🎯 Shooters',
      '🧩 Puzzle',
      '🌍 Open World'
    ],
    'Theater': [
      '🎭 Broadway',
      '🌍 West End',
      '🎪 Musicals',
      '📖 Plays',
      '👤 Playwrights',
      '🎨 Classical Theater'
    ],
    'Celebrities': [
      '🎬 Actors',
      '🎤 Musicians',
      '🎙️ Directors',
      '📺 TV Personalities',
      '🏆 Award Winners',
      '📱 Social Media Stars',
      '👗 Fashion Icons',
      '📚 Authors'
    ],
    
    // GEOGRAPHY
    'General Geography': null, // No genres for General Geography
    'Countries': [
      '🌍 Africa',
      '🌏 Asia',
      '🌎 Americas',
      '🇪🇺 Europe',
      '🦘 Oceania',
      '🏛️ Government & Politics'
    ],
    'Capitals': [
      '🌍 African Capitals',
      '🌏 Asian Capitals',
      '🌎 American Capitals',
      '🇪🇺 European Capitals',
      '🦘 Oceania Capitals',
      '🏛️ Historic Capitals'
    ],
    'Rivers & Mountains': [
      '🏔️ Major Mountain Ranges',
      '⛰️ Famous Peaks',
      '🌊 Longest Rivers',
      '💧 River Systems',
      '🗻 Volcanoes',
      '🏞️ Valleys & Canyons'
    ],
    'Flags': [
      '🌍 African Flags',
      '🌏 Asian Flags',
      '🌎 American Flags',
      '🇪🇺 European Flags',
      '🎨 Flag Design',
      '📜 Flag History'
    ],
    'Climate': [
      '🌡️ Climate Zones',
      '🌪️ Extreme Weather',
      '❄️ Polar Regions',
      '🏜️ Deserts',
      '🌴 Tropical Regions',
      '🌦️ Seasons & Patterns'
    ],
    'Landmarks': [
      '🗼 Modern Landmarks',
      '🏛️ Ancient Wonders',
      '🏰 Castles & Palaces',
      '🌉 Bridges',
      '🗽 Monuments',
      '🕌 Religious Sites'
    ],
    
    // SPORTS
    'General Sports': null, // No genres for General Sports
    'American Football': [
      '🏈 NFL',
      '🎓 College Football',
      '🏆 Super Bowl',
      '👤 Players/Legends',
      '📊 Records/Stats',
      '🏟️ Teams/Franchises'
    ],
    'Basketball': [
      '🏀 NBA',
      '🎓 College Basketball',
      '🏆 Championships',
      '👤 Players/Legends',
      '📊 Records/Stats',
      '🌍 International'
    ],
    'Baseball': [
      '⚾ MLB',
      '🎓 College Baseball',
      '🏆 World Series',
      '👤 Players/Legends',
      '📊 Records/Stats',
      '⚾ Classic Games'
    ],
    'Soccer': [
      '⚽ World Cup',
      '🏆 Premier League',
      '🇪🇸 La Liga',
      '🇮🇹 Serie A',
      '👤 Players/Legends',
      '🌍 International'
    ],
    'Olympics': [
      '🥇 Summer Olympics',
      '⛷️ Winter Olympics',
      '👤 Athletes/Legends',
      '🏆 Records',
      '📜 History',
      '🌍 Host Cities'
    ],
    'Tennis': [
      '🎾 Grand Slams',
      '👤 Players/Legends',
      '🏆 Championships',
      '📊 Records',
      '🎯 Modern Era',
      '📜 History'
    ],
    'Golf': [
      '⛳ Major Championships',
      '👤 Players/Legends',
      '🏆 PGA Tour',
      '🌍 International Golf',
      '📊 Records & Stats',
      '📜 Golf History'
    ],
    
    // LITERATURE
    'General Literature': null, // No genres for General Literature
    'Classic Novels': [
      '🇬🇧 British Literature',
      '🇺🇸 American Literature',
      '🇫🇷 French Literature',
      '🇷🇺 Russian Literature',
      '📜 19th Century',
      '📖 Victorian Era'
    ],
    'Poetry': [
      '📜 Epic Poetry',
      '💭 Romantic Poetry',
      '🎨 Modern Poetry',
      '👤 Famous Poets',
      '📖 Sonnets',
      '✍️ Free Verse'
    ],
    'Shakespeare': [
      '🎭 Tragedies',
      '😂 Comedies',
      '📜 Histories',
      '👑 Characters',
      '💬 Famous Quotes',
      '🎪 Plays'
    ],
    'Modern Fiction': [
      '📚 Contemporary Novels',
      '🏆 Award Winners',
      '👤 Bestselling Authors',
      '🌍 International Fiction',
      '🎨 Literary Fiction',
      '📖 Genre Fiction'
    ],
    'Fantasy': [
      '⚔️ Epic Fantasy',
      '🧙 Urban Fantasy',
      '🐉 Dragons & Magic',
      '👤 Famous Authors',
      '📚 Series',
      '🌍 World-Building'
    ],
    'Mystery': [
      '🔍 Detective Fiction',
      '🕵️ Crime Thrillers',
      '👤 Famous Detectives',
      '✍️ Mystery Authors',
      '📚 Classic Mysteries',
      '🎭 Noir'
    ],
    
    // FOOD & DRINK
    'General Food & Drink': null, // No genres for General Food & Drink
    'Cuisine': [
      '🍝 Italian',
      '🍜 Asian',
      '🥐 French',
      '🌮 Mexican',
      '🍛 Indian',
      '🍕 Mediterranean'
    ],
    'Cooking Techniques': [
      '🔥 Grilling & Roasting',
      '🍳 Sautéing & Frying',
      '🥘 Braising & Stewing',
      '🍞 Baking',
      '🔪 Knife Skills',
      '🌡️ Temperature Control'
    ],
    'Wine & Spirits': [
      '🍷 Red Wine',
      '🥂 White Wine',
      '🍾 Champagne & Sparkling',
      '🥃 Whiskey',
      '🍸 Cocktails',
      '🌍 Wine Regions'
    ],
    'Desserts': [
      '🍰 Cakes',
      '🍪 Cookies',
      '🍨 Ice Cream',
      '🥧 Pies & Tarts',
      '🍫 Chocolate',
      '🌍 International Sweets'
    ],
    'International Food': [
      '🌏 Asian Cuisine',
      '🌍 African Cuisine',
      '🌎 Latin American',
      '🇪🇺 European Cuisine',
      '🍜 Street Food',
      '🌶️ Spices & Flavors'
    ],
    'Food History': [
      '🏺 Ancient Foods',
      '🌍 Food Origins',
      '👤 Famous Chefs',
      '📜 Culinary Traditions',
      '💡 Food Innovations',
      '🍽️ Dining History'
    ],
    
    // TECHNOLOGY
    'General Technology': null, // No genres for General Technology
    'Programming': [
      '🐍 Python',
      '☕ Java',
      '📜 JavaScript',
      '⚙️ C/C++',
      '💎 Ruby',
      '🦀 Rust'
    ],
    'AI & Machine Learning': [
      '🤖 Deep Learning',
      '🧠 Neural Networks',
      '📊 Data Science',
      '👤 AI Pioneers',
      '🔮 AI Applications',
      '📜 AI History'
    ],
    'Internet History': [
      '🌐 Web Development',
      '👤 Internet Pioneers',
      '💡 Major Innovations',
      '📱 Social Media',
      '🔍 Search Engines',
      '💬 Communication Tools'
    ],
    'Gadgets': [
      '📱 Smartphones',
      '💻 Laptops & PCs',
      '⌚ Wearables',
      '🎮 Gaming Devices',
      '📷 Cameras',
      '🔊 Audio Devices'
    ],
    'Gaming': [
      '🎮 Console Gaming',
      '💻 PC Gaming',
      '📱 Mobile Gaming',
      '🕹️ Retro Gaming',
      '🏆 Esports',
      '👤 Game Developers'
    ],
    'Space Tech': [
      '🚀 Rockets & Spacecraft',
      '🛰️ Satellites',
      '👨‍🚀 Astronauts',
      '🌍 Space Agencies',
      '🔭 Space Telescopes',
      '🌌 Mars Missions'
    ],
    
    // BUSINESS
    'General Business': null, // No genres for General Business
    'Entrepreneurship': [
      '🚀 Startups',
      '💡 Innovation',
      '👤 Famous Entrepreneurs',
      '📈 Growth Strategies',
      '💰 Fundraising',
      '🏢 Small Business'
    ],
    'Finance & Banking': [
      '💵 Stock Market',
      '🏦 Banking History',
      '💰 Investment',
      '📊 Wall Street',
      '💳 Cryptocurrency',
      '🌍 Global Finance'
    ],
    'Marketing & Advertising': [
      '📺 TV Commercials',
      '📱 Digital Marketing',
      '🎯 Brand Strategy',
      '📰 Famous Campaigns',
      '🎨 Creative Advertising',
      '📊 Marketing History'
    ],
    'Tech Companies': [
      '🍎 Apple',
      '💻 Microsoft',
      '🔍 Google',
      '📘 Meta/Facebook',
      '🛒 Amazon',
      '⚡ Tesla & Others'
    ],
    'Business History': [
      '🏭 Industrial Revolution',
      '📈 Economic Booms',
      '📉 Market Crashes',
      '👤 Business Leaders',
      '🏢 Corporate Evolution',
      '💡 Major Innovations'
    ],
    'Economics': [
      '📊 Macroeconomics',
      '💰 Microeconomics',
      '🌍 Global Trade',
      '💵 Monetary Policy',
      '📈 Economic Theory',
      '👤 Famous Economists'
    ],
    
    // DISNEY
    'General Disney': null, // No genres for General Disney
    'Disney Movies': [
      '🎬 Classic Animation',
      '❄️ Modern Animation',
      '🎭 Live Action',
      '👑 Princesses',
      '🦁 Animal Films',
      '🏆 Award Winners'
    ],
    'Disney Parks': [
      '🏰 Magic Kingdom',
      '🌍 Epcot',
      '🎬 Hollywood Studios',
      '🦁 Animal Kingdom',
      '🌎 International Parks',
      '🎢 Attractions History'
    ],
    'Disney Characters': [
      '🐭 Mickey & Friends',
      '👑 Princesses',
      '🦹 Heroes',
      '😈 Villains',
      '🐾 Sidekicks',
      '🧚 Fairy Tale Characters'
    ],
    'Pixar': [
      '🎬 Pixar Films',
      '🚗 Cars Universe',
      '👾 Toy Story',
      '🐠 Finding Nemo/Dory',
      '👨‍👩‍👦 Incredibles',
      '🎭 Pixar Shorts'
    ],
    'Disney History': [
      '👤 Walt Disney',
      '🎬 Studio History',
      '🏢 Company Evolution',
      '📺 Disney Channel',
      '🎨 Animation Innovation',
      '🌟 Disney Legends'
    ],
    'Disney Music': [
      '🎵 Classic Songs',
      '🎤 Modern Hits',
      '🎹 Composers',
      '🎭 Musical Films',
      '🎸 Disney Rock',
      '🏆 Award-Winning Songs'
    ],
    
    // POP CULTURE
    'General Pop Culture': null, // No genres for General Pop Culture
    '2020s Culture': [
      '📱 Social Media Trends',
      '🎬 Popular Shows/Movies',
      '🎵 Music Hits',
      '🔥 Viral Moments',
      '👗 Fashion Trends',
      '💬 Slang & Language'
    ],
    '2010s Culture': [
      '📱 Tech Revolution',
      '🎬 Blockbusters',
      '🎵 Music Evolution',
      '📺 Peak TV',
      '🔥 Viral Sensations',
      '👗 Fashion & Trends'
    ],
    '2000s Culture': [
      '💿 Music Scene',
      '📺 Reality TV',
      '🎮 Gaming Explosion',
      '👗 Y2K Fashion',
      '📱 Early Social Media',
      '🎬 Movies'
    ],
    '90s Culture': [
      '📺 TV Shows',
      '🎵 Music Genres',
      '🎮 Gaming',
      '👗 Grunge & Fashion',
      '🎬 Movies',
      '🎯 Toys & Fads'
    ],
    '80s Culture': [
      '🎸 Music Icons',
      '📺 TV Classics',
      '🎬 Blockbusters',
      '👗 Fashion',
      '🎮 Arcade Games',
      '🎯 Toys & Trends'
    ],
    'Viral Moments': [
      '🔥 Internet Sensations',
      '📱 TikTok Trends',
      '🎵 Viral Songs',
      '😂 Meme Origins',
      '🎬 Viral Videos',
      '💬 Catchphrases'
    ],
    
    // INTERNET CULTURE
    'General Internet Culture': null, // No genres for General Internet Culture
    'Memes': [
      '😂 Classic Memes',
      '🔥 Current Memes',
      '🐸 Pepe & Wojak',
      '🐕 Doge & Animals',
      '🎭 Format Memes',
      '📜 Meme History'
    ],
    'Social Media': [
      '📘 Facebook Era',
      '📸 Instagram Culture',
      '🐦 Twitter/X',
      '📱 TikTok',
      '💬 Reddit',
      '👻 Snapchat'
    ],
    'YouTube & Creators': [
      '🎮 Gaming YouTubers',
      '😂 Comedy Creators',
      '🎨 Art & Creativity',
      '📚 Educational',
      '🎬 Film & Production',
      '💬 Commentary'
    ],
    'Gaming Culture': [
      '🎮 Twitch Streamers',
      '🏆 Esports',
      '😂 Gaming Memes',
      '💬 Gaming Communities',
      '🎯 Speedrunning',
      '📱 Mobile Gaming'
    ],
    'Tech Trends': [
      '🤖 AI & Chatbots',
      '💰 Cryptocurrency',
      '🎨 NFTs',
      '🌐 Web3',
      '📱 App Culture',
      '🔒 Privacy Issues'
    ],
    'Internet History': [
      '🌐 Early Internet',
      '💬 Forums & Chat',
      '📺 Flash Era',
      '🎮 Browser Games',
      '📧 Email & Messaging',
      '💿 MySpace Era'
    ],
    
    // POLITICS
    'General Politics': null, // No genres for General Politics
    'U.S. Politics': [
      '🏛️ Congress',
      '🗳️ Presidential History',
      '⚖️ Supreme Court',
      '🗽 Political Parties',
      '📜 Legislation',
      '🏛️ State Politics'
    ],
    'World Politics': [
      '🇬🇧 UK Politics',
      '🇪🇺 European Union',
      '🌏 Asian Politics',
      '🌍 African Politics',
      '🌎 Latin America',
      '🤝 International Relations'
    ],
    'Political History': [
      '⚔️ Revolutions',
      '📜 Constitutional History',
      '👤 Political Leaders',
      '🗳️ Voting Rights',
      '⚖️ Civil Rights',
      '🌍 Decolonization'
    ],
    'Elections': [
      '🗳️ Presidential Elections',
      '📊 Historic Campaigns',
      '🎯 Election Systems',
      '📺 Debates',
      '🗽 Primary Process',
      '🌍 Global Elections'
    ],
    'Government Systems': [
      '🏛️ Democracy',
      '📜 Constitutions',
      '⚖️ Judicial Systems',
      '🏢 Bureaucracy',
      '🗳️ Voting Systems',
      '🌍 Comparative Government'
    ],
    'Political Leaders': [
      '👤 U.S. Presidents',
      '👑 Prime Ministers',
      '🌍 World Leaders',
      '📜 Historical Figures',
      '🏆 Nobel Peace Prize',
      '⚔️ Wartime Leaders'
    ],
    
    // TRUE CRIME
    'General True Crime': null, // No genres for General True Crime
    'Famous Cases': [
      '📰 20th Century',
      '📱 Modern Cases',
      '👤 Celebrity Cases',
      '🌍 International',
      '⚖️ Landmark Trials',
      '🔍 Cold Cases'
    ],
    'Serial Killers': [
      '📜 Historical',
      '🌍 International',
      '🕵️ Caught Cases',
      '🧠 Psychology',
      '📺 Documented',
      '⚖️ Trials'
    ],
    'Unsolved Mysteries': [
      '❓ Missing Persons',
      '💎 Heists',
      '🌊 Disappearances',
      '🔍 Cold Cases',
      '🌍 International',
      '📜 Historical'
    ],
    'Forensics': [
      '🔬 DNA Evidence',
      '🔍 Crime Scene Investigation',
      '🧬 Forensic Science',
      '💻 Digital Forensics',
      '👤 Profiling',
      '🏛️ Expert Testimony'
    ],
    'Legal System': [
      '⚖️ Court Procedures',
      '👨‍⚖️ Famous Lawyers',
      '🏛️ Landmark Cases',
      '📜 Criminal Law',
      '👮 Law Enforcement',
      '🌍 International Law'
    ],
    'Crime History': [
      '🏴‍☠️ Organized Crime',
      '📜 Historic Crimes',
      '🌍 Crime Evolution',
      '👤 Infamous Criminals',
      '⚖️ Justice Reform',
      '🏛️ Legal Milestones'
    ],
    
    // ANIMALS
    'General Animals': null, // No genres for General Animals
    'Mammals': [
      '🦁 Big Cats',
      '🐘 Elephants & Rhinos',
      '🐵 Primates',
      '🐻 Bears',
      '🐋 Marine Mammals',
      '🦘 Marsupials'
    ],
    'Birds': [
      '🦅 Birds of Prey',
      '🦜 Parrots',
      '🐧 Flightless Birds',
      '🦆 Waterfowl',
      '🦉 Owls',
      '🕊️ Songbirds'
    ],
    'Marine Life': [
      '🦈 Sharks',
      '🐋 Whales & Dolphins',
      '🐠 Tropical Fish',
      '🦑 Octopus & Squid',
      '🦀 Crustaceans',
      '🐢 Sea Turtles'
    ],
    'Reptiles & Amphibians': [
      '🐍 Snakes',
      '🦎 Lizards',
      '🐊 Crocodilians',
      '🐸 Frogs & Toads',
      '🐢 Turtles & Tortoises',
      '🦎 Geckos & Chameleons'
    ],
    'Insects & Arachnids': [
      '🦋 Butterflies & Moths',
      '🐝 Bees & Wasps',
      '🐜 Ants',
      '🕷️ Spiders',
      '🪲 Beetles',
      '🦗 Other Insects'
    ],
    'Endangered Species': [
      '🐼 Giant Pandas',
      '🦏 Rhinos',
      '🐅 Tigers',
      '🦍 Great Apes',
      '🐘 Elephants',
      '🌍 Conservation Efforts'
    ]
  };

  const topics = [
    { 
      id: 'history', 
      name: 'History', 
      emoji: '📜',
      subtopics: [
        { name: 'General History', emoji: '🌍' },
        { name: 'Ancient Civilizations', emoji: '🏛️' },
        { name: 'World Wars', emoji: '⚔️' },
        { name: 'Medieval Times', emoji: '🏰' },
        { name: 'Renaissance', emoji: '🎨' },
        { name: 'American History', emoji: '🗽' },
        { name: 'Asian History', emoji: '🏯' }
      ]
    },
    { 
      id: 'science', 
      name: 'Science', 
      emoji: '🔬',
      subtopics: [
        { name: 'General Science', emoji: '🧪' },
        { name: 'Physics', emoji: '⚛️' },
        { name: 'Chemistry', emoji: '🧬' },
        { name: 'Biology', emoji: '🦠' },
        { name: 'Astronomy', emoji: '🌌' },
        { name: 'Earth Science', emoji: '🌋' },
        { name: 'Quantum Mechanics', emoji: '⚡' }
      ]
    },
    { 
      id: 'entertainment', 
      name: 'Entertainment', 
      emoji: '🎬',
      subtopics: [
        { name: 'General Entertainment', emoji: '🎭' },
        { name: 'Movies', emoji: '🎥' },
        { name: 'TV Shows', emoji: '📺' },
        { name: 'Music', emoji: '🎵' },
        { name: 'Video Games', emoji: '🎮' },
        { name: 'Theater', emoji: '🎪' },
        { name: 'Celebrities', emoji: '⭐' }
      ]
    },
    { 
      id: 'geography', 
      name: 'Geography', 
      emoji: '🌍',
      subtopics: [
        { name: 'General Geography', emoji: '🗺️' },
        { name: 'Countries', emoji: '🌐' },
        { name: 'Capitals', emoji: '🏙️' },
        { name: 'Rivers & Mountains', emoji: '⛰️' },
        { name: 'Flags', emoji: '🚩' },
        { name: 'Climate', emoji: '🌦️' },
        { name: 'Landmarks', emoji: '🗼' }
      ]
    },
    { 
      id: 'sports', 
      name: 'Sports', 
      emoji: '⚽',
      subtopics: [
        { name: 'General Sports', emoji: '🏆' },
        { name: 'American Football', emoji: '🏈' },
        { name: 'Basketball', emoji: '🏀' },
        { name: 'Baseball', emoji: '⚾' },
        { name: 'Soccer', emoji: '⚽' },
        { name: 'Olympics', emoji: '🥇' },
        { name: 'Tennis', emoji: '🎾' },
        { name: 'Golf', emoji: '⛳' }
      ]
    },
    { 
      id: 'literature', 
      name: 'Literature', 
      emoji: '📚',
      subtopics: [
        { name: 'General Literature', emoji: '📖' },
        { name: 'Classic Novels', emoji: '📕' },
        { name: 'Poetry', emoji: '✍️' },
        { name: 'Shakespeare', emoji: '🎭' },
        { name: 'Modern Fiction', emoji: '📘' },
        { name: 'Fantasy', emoji: '🐉' },
        { name: 'Mystery', emoji: '🔍' }
      ]
    },
    { 
      id: 'food', 
      name: 'Food & Drink', 
      emoji: '🍕',
      subtopics: [
        { name: 'General Food & Drink', emoji: '🍽️' },
        { name: 'Cuisine', emoji: '🥘' },
        { name: 'Cooking Techniques', emoji: '👨‍🍳' },
        { name: 'Wine & Spirits', emoji: '🍷' },
        { name: 'Desserts', emoji: '🍰' },
        { name: 'International Food', emoji: '🌮' },
        { name: 'Food History', emoji: '📜' }
      ]
    },
    { 
      id: 'technology', 
      name: 'Technology', 
      emoji: '💻',
      subtopics: [
        { name: 'General Technology', emoji: '⚙️' },
        { name: 'Programming', emoji: '💾' },
        { name: 'AI & Machine Learning', emoji: '🤖' },
        { name: 'Internet History', emoji: '🌐' },
        { name: 'Gadgets', emoji: '📱' },
        { name: 'Gaming', emoji: '🕹️' },
        { name: 'Space Tech', emoji: '🚀' }
      ]
    },
    { 
      id: 'business', 
      name: 'Business', 
      emoji: '💼',
      subtopics: [
        { name: 'General Business', emoji: '🏢' },
        { name: 'Entrepreneurship', emoji: '🚀' },
        { name: 'Finance & Banking', emoji: '💰' },
        { name: 'Marketing & Advertising', emoji: '📊' },
        { name: 'Tech Companies', emoji: '💻' },
        { name: 'Business History', emoji: '📜' },
        { name: 'Economics', emoji: '📈' }
      ]
    },
    { 
      id: 'disney', 
      name: 'Disney', 
      emoji: '🏰',
      subtopics: [
        { name: 'General Disney', emoji: '✨' },
        { name: 'Disney Movies', emoji: '🎬' },
        { name: 'Disney Parks', emoji: '🎢' },
        { name: 'Disney Characters', emoji: '🐭' },
        { name: 'Pixar', emoji: '💡' },
        { name: 'Disney History', emoji: '📜' },
        { name: 'Disney Music', emoji: '🎵' }
      ]
    },
    { 
      id: 'popculture', 
      name: 'Pop Culture', 
      emoji: '🎤',
      subtopics: [
        { name: 'General Pop Culture', emoji: '🌟' },
        { name: '2020s Culture', emoji: '📱' },
        { name: '2010s Culture', emoji: '💿' },
        { name: '2000s Culture', emoji: '📼' },
        { name: '90s Culture', emoji: '📺' },
        { name: '80s Culture', emoji: '📻' },
        { name: 'Viral Moments', emoji: '🔥' }
      ]
    },
    { 
      id: 'internet', 
      name: 'Internet Culture', 
      emoji: '🌐',
      subtopics: [
        { name: 'General Internet Culture', emoji: '💻' },
        { name: 'Memes', emoji: '😂' },
        { name: 'Social Media', emoji: '📱' },
        { name: 'YouTube & Creators', emoji: '📹' },
        { name: 'Gaming Culture', emoji: '🎮' },
        { name: 'Tech Trends', emoji: '🚀' },
        { name: 'Internet History', emoji: '🌐' }
      ]
    },
    { 
      id: 'politics', 
      name: 'Politics', 
      emoji: '🏛️',
      subtopics: [
        { name: 'General Politics', emoji: '⚖️' },
        { name: 'U.S. Politics', emoji: '🇺🇸' },
        { name: 'World Politics', emoji: '🌍' },
        { name: 'Political History', emoji: '📜' },
        { name: 'Elections', emoji: '🗳️' },
        { name: 'Government Systems', emoji: '🏛️' },
        { name: 'Political Leaders', emoji: '👔' }
      ]
    },
    { 
      id: 'truecrime', 
      name: 'True Crime', 
      emoji: '🔍',
      subtopics: [
        { name: 'General True Crime', emoji: '🕵️' },
        { name: 'Famous Cases', emoji: '📰' },
        { name: 'Serial Killers', emoji: '👤' },
        { name: 'Unsolved Mysteries', emoji: '❓' },
        { name: 'Forensics', emoji: '🔬' },
        { name: 'Legal System', emoji: '⚖️' },
        { name: 'Crime History', emoji: '📜' }
      ]
    },
    { 
      id: 'animals', 
      name: 'Animals', 
      emoji: '🦁',
      subtopics: [
        { name: 'General Animals', emoji: '🐾' },
        { name: 'Mammals', emoji: '🐘' },
        { name: 'Birds', emoji: '🦅' },
        { name: 'Marine Life', emoji: '🐋' },
        { name: 'Reptiles & Amphibians', emoji: '🦎' },
        { name: 'Insects & Arachnids', emoji: '🦋' },
        { name: 'Endangered Species', emoji: '🐼' }
      ]
    }
  ];

  const generateTrivia = async (prompt) => {
    setIsGenerating(true);
    setStep('generating');

    const difficultyDescriptions = {
      easy: {
        description: 'easy to answer, requiring general knowledge that most people would know',
        examples: 'Basic facts, common knowledge, well-known information accessible to casual audiences',
        challenge: 'Should be answerable by someone with basic general education'
      },
      medium: {
        description: 'moderately challenging, requiring specific knowledge or deeper understanding',
        examples: 'Requires attention to detail, some specialized knowledge, or connecting multiple concepts',
        challenge: 'Should require thought and some specific knowledge beyond casual familiarity'
      },
      hard: {
        description: 'difficult and detailed, requiring expert-level knowledge or obscure facts',
        examples: 'Deep knowledge, obscure details, technical specifics, lesser-known historical facts',
        challenge: 'Should challenge even knowledgeable enthusiasts in the subject'
      },
      impossible: {
        description: 'extremely challenging, requiring deep expert knowledge, rare historical details, or highly specialized information',
        examples: 'Extremely specific dates, ultra-obscure facts, technical minutiae, esoteric knowledge',
        challenge: 'Should only be answerable by true experts or those with encyclopedic knowledge'
      }
    };

    // Generate a random seed to encourage diversity
    const diversitySeed = Math.random().toString(36).substring(7);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            { 
              role: "user", 
              content: `You are an expert trivia question creator with a focus on 100% factual accuracy and proper difficulty calibration. Generate exactly ${questionCount} unique, high-quality trivia questions about: ${prompt}

CRITICAL DIFFICULTY CALIBRATION FOR ${selectedDifficulty.toUpperCase()}:
- Level: ${difficultyDescriptions[selectedDifficulty].description}
- Examples: ${difficultyDescriptions[selectedDifficulty].examples}
- Challenge standard: ${difficultyDescriptions[selectedDifficulty].challenge}

DIFFICULTY-SPECIFIC REQUIREMENTS:
${selectedDifficulty === 'easy' ? `
- Ask about widely known facts, basic information, famous names/events
- Questions should be straightforward with clear, commonly known answers
- Avoid obscure details or technical specifics
- Examples: "What ocean is the largest?", "Who painted the Mona Lisa?"
` : ''}${selectedDifficulty === 'medium' ? `
- Ask about specific details that require dedicated knowledge
- Include some technical terms or specific dates/numbers
- Require understanding beyond surface-level familiarity
- Examples: "In what year was X founded?", "Which country produces the most Y?"
` : ''}${selectedDifficulty === 'hard' ? `
- Ask about obscure facts, specific technical details, rare knowledge
- Include precise dates, lesser-known figures, specialized terminology
- Require deep knowledge or research to answer
- Examples: "What was the original name of X before 1847?", "Which element has atomic number 79?"
` : ''}${selectedDifficulty === 'impossible' ? `
- Ask about extremely specific details known only to experts
- Include ultra-precise facts, rare historical minutiae, esoteric knowledge
- Should stump even dedicated enthusiasts
- Examples: "What was the exact time of day X occurred?", "Name the third assistant director on Y film"
` : ''}

CRITICAL: PREVENT CROSS-DIFFICULTY DUPLICATES
- DO NOT ask questions that could appear at other difficulty levels
- Each question should be UNIQUE to its difficulty level
- Avoid generic questions that could be made easier or harder
- Use difficulty-appropriate specificity:
  * EASY: "What year did World War II end?" (1945 - widely known)
  * MEDIUM: "What battle marked the turning point in the Pacific during WWII?" (Midway - requires specific knowledge)
  * HARD: "Who was the commander of the USS Enterprise at the Battle of Midway?" (Raymond Spruance - obscure detail)
  * IMPOSSIBLE: "What was the exact time the first torpedo hit the USS Yorktown at Midway?" (ultra-specific)
- If a topic is exhausted at a difficulty level, move to completely different aspects
- NEVER create a question that could be answered at a different difficulty by adding/removing detail

CRITICAL: NEVER GIVE AWAY THE ANSWER IN THE QUESTION
- Do NOT include the answer or obvious hints within the question text
- Avoid phrasing like "What is the capital of France, known for the Eiffel Tower?" (gives away Paris)
- Bad example: "What 1994 film starring Tom Hanks featured the quote 'Life is like a box of chocolates'?" (gives away Forrest Gump)
- Good example: "Which 1994 film features the quote 'Life is like a box of chocolates'?"
- Bad example: "In which Shakespeare play does the character Hamlet say 'To be or not to be'?" (gives away the play)
- Good example: "Which Shakespeare character speaks the line 'To be or not to be'?"
- The question should genuinely test knowledge, not just reading comprehension

FACTUAL ACCURACY REQUIREMENTS:
- Every answer must be a verified, indisputable fact
- Use only information from reliable sources (historical records, official statistics, documented events)
- For dates, names, numbers, and specific details: BE ABSOLUTELY CERTAIN they are correct
- If a fact is disputed or has multiple versions, choose a different question topic
- Do NOT include questions with ambiguous or debatable answers
- For current events/statistics: only use well-documented, unchanging facts
- Double-check all numerical data, dates, and proper nouns for accuracy

DIVERSITY & QUALITY REQUIREMENTS:
- Each question must be completely unique and diverse - avoid similar themes, time periods, or subject matter
- Questions should be engaging, surprising, and educational
- Answers should be specific, clear, and unambiguous
- Vary the types of questions: dates, people, places, events, concepts, records, achievements, etc.
- Draw from a broad range of subtopics within "${prompt}" to maximize variety
- Avoid common or overused trivia questions
- Make questions interesting and worth knowing

ACCURACY VERIFICATION:
- Before including any question, verify the answer is 100% correct
- Reject questions where you're not completely certain of the answer
- Use concrete, documented facts only
- Avoid speculation, estimates, or "approximately" type answers

Diversity seed: ${diversitySeed}

Return ONLY a JSON array with this exact format, no other text:
[
  {
    "question": "Question text here?",
    "answer": "Precise, factual answer here",
    "difficulty": "${selectedDifficulty}",
    "category": "Specific category"
  }
]

Remember: 
1. Accuracy is paramount - every answer must be verifiably correct
2. Questions must NOT give away the answer
3. Difficulty must be precisely calibrated to ${selectedDifficulty} level
4. Questions must be UNIQUE to this difficulty - no cross-difficulty duplicates` 
            }
          ],
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      // Clean the response and parse JSON
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const questions = JSON.parse(cleanContent);
      
      setTriviaQuestions(questions);
      setStep('results');
    } catch (error) {
      console.error('Error generating trivia:', error);
      alert('Failed to generate trivia questions. Please try again.');
      setStep('home');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      generateTrivia(customPrompt);
    }
  };

  const handleGuidedGenerate = () => {
    if (selectedTopic && selectedSubtopic) {
      const topic = topics.find(t => t.id === selectedTopic);
      const subtopicData = topic.subtopics.find(s => s.name === selectedSubtopic);
      
      let prompt;
      
      // If genre is selected, include it in the prompt
      if (selectedGenre) {
        const genreName = selectedGenre.replace(/[^\w\s]/g, '').trim(); // Remove emoji
        prompt = `${genreName} ${subtopicData.name}`;
      } else if (subtopicData.name.startsWith('General')) {
        // If it's a general subtopic, just use the topic name
        prompt = topic.name;
      } else {
        prompt = `${subtopicData.name} in ${topic.name}`;
      }
      
      generateTrivia(prompt);
    }
  };

  const handleRegenerateQuestions = () => {
    // Check if we have a custom prompt or guided selection
    if (customPrompt.trim()) {
      // Regenerate from custom prompt
      generateTrivia(customPrompt);
    } else if (selectedTopic && selectedSubtopic) {
      // Regenerate from guided selection
      const topic = topics.find(t => t.id === selectedTopic);
      const subtopicData = topic.subtopics.find(s => s.name === selectedSubtopic);
      
      let prompt;
      
      // If genre is selected, include it in the prompt
      if (selectedGenre) {
        const genreName = selectedGenre.replace(/[^\w\s]/g, '').trim(); // Remove emoji
        prompt = `${genreName} ${subtopicData.name}`;
      } else if (subtopicData.name.startsWith('General')) {
        prompt = topic.name;
      } else {
        prompt = `${subtopicData.name} in ${topic.name}`;
      }
      
      generateTrivia(prompt);
    }
  };

  const reset = () => {
    setStep('home');
    setCustomPrompt('');
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setSelectedGenre(null);
    setSelectedDifficulty('medium');
    setQuestionCount(10);
    setTriviaQuestions([]);
    setGameMode(null);
    setGameStep('setup');
    setGameTopic(null);
    setGameSubtopic(null);
    setGameGenre(null);
    setGameDifficulty('medium');
  };

  const startGame = async () => {
    if (!gameTopic || !gameSubtopic) return;

    setGameStep('generating');
    setIsGenerating(true);

    const topic = topics.find(t => t.id === gameTopic);
    const subtopicData = topic.subtopics.find(s => s.name === gameSubtopic);
    
    let prompt;
    if (gameGenre) {
      const genreName = gameGenre.replace(/[^\w\s]/g, '').trim();
      prompt = `${genreName} ${subtopicData.name}`;
    } else if (subtopicData.name.startsWith('General')) {
      prompt = topic.name;
    } else {
      prompt = `${subtopicData.name} in ${topic.name}`;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            { 
              role: "user", 
              content: `Generate exactly 20 multiple choice trivia questions about: ${prompt}

REQUIREMENTS:
- Difficulty: ${gameDifficulty}
- Each question must have 4 answer options (A, B, C, D)
- Only ONE correct answer per question
- Make questions rapid-fire appropriate (can be answered in 5-10 seconds)
- Questions should be clear and concise
- Answers must be 100% factually correct
- Vary the question types and topics

CRITICAL: PREVENT CROSS-DIFFICULTY DUPLICATES
- Questions must be UNIQUE to the ${gameDifficulty} difficulty level
- Do NOT create questions that could appear at other difficulty levels
- Use difficulty-appropriate specificity for ${gameDifficulty}:
  * EASY: Well-known facts, famous names, basic information
  * MEDIUM: Specific details requiring dedicated knowledge
  * HARD: Obscure facts, technical details, lesser-known information
  * IMPOSSIBLE: Ultra-specific details, rare minutiae, expert-only knowledge
- Each question should be impossible to answer at easier difficulty levels
- If a topic is exhausted, move to different aspects entirely

NEVER GIVE AWAY THE ANSWER:
- Do not include the answer or obvious hints in the question
- Questions should genuinely test knowledge

Return ONLY a JSON array:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "category": "Category"
  }
]

The correctAnswer should be the index (0-3) of the correct option.`
            }
          ],
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const questions = JSON.parse(cleanContent);
      
      setGameQuestions(questions);
      setCurrentQuestionIndex(0);
      setGameScore(0);
      setAnsweredQuestions([]);
      setTimeRemaining(gameTime);
      setQuestionStartTime(Date.now());
      setGameStep('playing');
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating game:', error);
      alert('Failed to generate game questions. Please try again.');
      setGameStep('setup');
      setIsGenerating(false);
    }
  };

  const handleGameAnswer = (selectedIndex) => {
    const currentQuestion = gameQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    const timeToAnswer = (Date.now() - questionStartTime) / 1000; // seconds
    
    // Show immediate feedback
    setSelectedAnswerFeedback({ index: selectedIndex, isCorrect });
    
    let points = 0;
    if (isCorrect) {
      // Base points: 100
      // Speed bonus: up to 100 points (faster = more points)
      // Max time to answer: 10 seconds for full bonus
      const speedBonus = Math.max(0, Math.floor((10 - timeToAnswer) * 10));
      points = 100 + speedBonus;
    }

    setAnsweredQuestions([...answeredQuestions, {
      question: currentQuestion.question,
      selectedAnswer: currentQuestion.options[selectedIndex],
      correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
      isCorrect,
      points,
      timeToAnswer: timeToAnswer.toFixed(2)
    }]);

    const newScore = gameScore + points;
    setGameScore(newScore);

    // Move to next question after brief delay to show feedback
    setTimeout(() => {
      setSelectedAnswerFeedback(null);
      
      if (currentQuestionIndex < gameQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionStartTime(Date.now());
      } else {
        // Game over - save high score if authenticated
        if (isAuthenticated && user) {
          saveHighScore(newScore);
        }
        setGameStep('results');
      }
    }, 800);
  };

  // Authentication functions
  const handleSignIn = (username, password) => {
    // In production, this would call your backend API
    // For demo, we'll use localStorage
    const users = JSON.parse(localStorage.getItem('triviaUsers') || '{}');
    
    if (users[username] && users[username].password === password) {
      const userData = {
        username,
        email: users[username].email,
        highScores: users[username].highScores || []
      };
      setUser(userData);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      localStorage.setItem('currentUser', JSON.stringify(username));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const handleSignUp = (username, email, password) => {
    // In production, this would call your backend API
    const users = JSON.parse(localStorage.getItem('triviaUsers') || '{}');
    
    if (users[username]) {
      return { success: false, error: 'Username already exists' };
    }
    
    users[username] = {
      email,
      password,
      highScores: []
    };
    
    localStorage.setItem('triviaUsers', JSON.stringify(users));
    
    const userData = {
      username,
      email,
      highScores: []
    };
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('currentUser', JSON.stringify(username));
    return { success: true };
  };

  const handleGoogleSignIn = () => {
    // Check if Google Identity Services is available
    if (typeof window.google !== 'undefined' && window.google.accounts) {
      // Trigger Google One Tap or Sign In prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: Show custom button click flow
          console.log('Google One Tap not shown:', notification.getNotDisplayedReason());
        }
      });
    } else {
      // Google library not loaded yet - show loading message
      alert('Loading Google Sign-In... Please try again in a moment.');
      setTimeout(initializeGoogleSignIn, 1000);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const saveHighScore = (score) => {
    if (!isAuthenticated || !user) return;
    
    const users = JSON.parse(localStorage.getItem('triviaUsers') || '{}');
    
    if (users[user.username]) {
      const newHighScore = {
        score,
        difficulty: gameDifficulty,
        topic: `${gameSubtopic}${gameGenre ? ' - ' + gameGenre : ''}`,
        date: new Date().toISOString(),
        questionsAnswered: answeredQuestions.length,
        correctAnswers: answeredQuestions.filter(q => q.isCorrect).length
      };
      
      users[user.username].highScores = users[user.username].highScores || [];
      users[user.username].highScores.push(newHighScore);
      
      // Keep only top 10 scores
      users[user.username].highScores.sort((a, b) => b.score - a.score);
      users[user.username].highScores = users[user.username].highScores.slice(0, 10);
      
      localStorage.setItem('triviaUsers', JSON.stringify(users));
      
      // Update local state
      setUser({
        ...user,
        highScores: users[user.username].highScores
      });
    }
  };

  // Load user from localStorage on mount and initialize Google Sign-In
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const username = JSON.parse(savedUser);
      const users = JSON.parse(localStorage.getItem('triviaUsers') || '{}');
      if (users[username]) {
        setUser({
          username,
          email: users[username].email,
          displayName: users[username].displayName,
          picture: users[username].picture,
          highScores: users[username].highScores || []
        });
        setIsAuthenticated(true);
      }
    }

    // Initialize Google Sign-In
    initializeGoogleSignIn();
  }, []);

  const initializeGoogleSignIn = () => {
    // Check if Google Identity Services is loaded
    if (typeof window.google !== 'undefined' && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
    } else {
      // Google library not loaded - load it dynamically
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        }
      };
      document.head.appendChild(script);
    }
  };

  const handleGoogleCredentialResponse = (response) => {
    // Decode JWT token to get user info
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    if (!payload) {
      alert('Failed to sign in with Google. Please try again.');
      return;
    }

    // Extract user information
    const { sub: googleId, email, name, picture } = payload;
    
    // Create or get user account
    const users = JSON.parse(localStorage.getItem('triviaUsers') || '{}');
    const username = `google_${googleId}`;
    
    if (!users[username]) {
      // Create new user from Google account
      users[username] = {
        email,
        password: null, // OAuth users don't have password
        authProvider: 'google',
        googleId,
        displayName: name,
        picture,
        highScores: [],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('triviaUsers', JSON.stringify(users));
    }
    
    // Sign in user
    const userData = {
      username,
      email,
      displayName: name,
      picture,
      highScores: users[username].highScores || []
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('currentUser', JSON.stringify(username));
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'medium': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'hard': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'impossible': return 'linear-gradient(135deg, #8b5cf6, #6366f1)';
      default: return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#1f2937',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Mobile App Banner */}
      {showMobileBanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0
            }}>
              📱
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.2
              }}>
                Get the TriviaIQ App
              </div>
              <div style={{ 
                fontSize: '11px', 
                opacity: 0.85,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.2,
                marginTop: '2px'
              }}>
                iOS & Android
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <a
              href="#"
              style={{
                padding: '6px 14px',
                background: '#ffffff',
                color: '#1f2937',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: "'Inter', sans-serif",
                whiteSpace: 'nowrap',
                lineHeight: 1.3
              }}
            >
              Download
            </a>
            <button
              onClick={() => setShowMobileBanner(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '2px 4px',
                opacity: 0.7,
                fontSize: '20px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowAuthModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontFamily: "'Space Grotesk', monospace",
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '8px',
              textAlign: 'center'
            }} className="gradient-text">
              {authMode === 'signin' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '24px',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif"
            }}>
              {authMode === 'signin' 
                ? 'Sign in to save your high scores' 
                : 'Sign up to track your progress'}
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const username = formData.get('username');
              const email = formData.get('email');
              const password = formData.get('password');
              
              if (authMode === 'signin') {
                const result = handleSignIn(username, password);
                if (!result.success) alert(result.error);
              } else {
                const result = handleSignUp(username, email, password);
                if (!result.success) alert(result.error);
              }
            }}>
              <input
                name="username"
                type="text"
                placeholder="Username"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box'
                }}
              />
              {authMode === 'signup' && (
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    boxSizing: 'border-box'
                  }}
                />
              )}
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                className="primary-btn"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <button
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                border: '1px solid #dadce0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Roboto', 'Inter', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px',
                transition: 'all 0.2s',
                color: '#3c4043'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#d2d3d4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#dadce0';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8b5cf6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purple gradient header background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '320px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        zIndex: 0
      }}>
        {/* Animated gradient orbs in header */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: 'float 25s infinite ease-in-out'
        }}/>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: 'float 30s infinite ease-in-out reverse'
        }}/>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&family=Poppins:wght@700;800&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        .playful-pop-logo {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(36px, 8vw, 56px);
          font-weight: 800;
          position: relative;
          display: inline-block;
          line-height: 1;
        }
        
        .playful-pop-logo .trivia {
          color: #6366f1;
        }
        
        .playful-pop-logo .iq {
          background: linear-gradient(135deg, #ec4899, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .playful-pop-logo::before {
          content: '?';
          position: absolute;
          top: -10px;
          right: -28px;
          font-size: clamp(32px, 6vw, 48px);
          color: #ec4899;
          transform: rotate(15deg);
        }
        
        @media (max-width: 640px) {
          .playful-pop-logo::before {
            top: -8px;
            right: -22px;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-30px, 30px) scale(0.95); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6), 0 0 60px rgba(236, 72, 153, 0.3); }
        }

        .trivia-container {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 640px) {
          .trivia-container {
            padding: 20px;
            border-radius: 12px;
          }
        }

        .trivia-container:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #d1d5db;
        }

        .topic-btn {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
          list-style: none;
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 640px) {
          .topic-btn {
            padding: 12px;
          }
        }

        .topic-btn::before {
          content: '';
          position: 'absolute';
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.05), transparent);
          transition: left 0.5s;
        }

        .topic-btn:hover::before {
          left: 100%;
        }

        .topic-btn:hover {
          border-color: #a78bfa;
          background: #faf5ff;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
        }

        @media (hover: none) {
          .topic-btn:hover {
            transform: none;
          }
        }

        .topic-btn.selected {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .difficulty-btn {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .difficulty-btn {
            padding: 10px 16px;
            font-size: 13px;
          }
        }

        .difficulty-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }

        @media (hover: none) {
          .difficulty-btn:hover {
            transform: none;
          }
        }

        .difficulty-btn.selected {
          border: 2px solid transparent;
          background-origin: border-box;
          background-clip: padding-box, border-box;
          transform: translateY(-2px);
        }

        .difficulty-btn.selected.easy {
          background: linear-gradient(#ffffff, #ffffff) padding-box,
                      linear-gradient(135deg, #10b981, #059669) border-box;
          color: #059669;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .difficulty-btn.selected.medium {
          background: linear-gradient(#ffffff, #ffffff) padding-box,
                      linear-gradient(135deg, #f59e0b, #d97706) border-box;
          color: #d97706;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .difficulty-btn.selected.hard {
          background: linear-gradient(#ffffff, #ffffff) padding-box,
                      linear-gradient(135deg, #ef4444, #dc2626) border-box;
          color: #dc2626;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .difficulty-btn.selected.impossible {
          background: linear-gradient(#ffffff, #ffffff) padding-box,
                      linear-gradient(135deg, #8b5cf6, #6366f1) border-box;
          color: #7c3aed;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .custom-input {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 18px;
          color: #1f2937;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          width: 100%;
          transition: all 0.3s ease;
        }

        .custom-input:focus {
          outline: none;
          border-color: #8b5cf6;
          background: #fefefe;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .custom-input::placeholder {
          color: #9ca3af;
        }

        .primary-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          background-size: 200% 200%;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          animation: glow 3s infinite;
        }

        @media (max-width: 640px) {
          .primary-btn {
            padding: 12px 24px;
            font-size: 14px;
            width: 100%;
            justify-content: center;
          }
        }

        .primary-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .primary-btn:hover::before {
          transform: translateX(100%);
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
          background-position: 100% 50%;
        }

        @media (hover: none) {
          .primary-btn:hover {
            transform: none;
          }
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          animation: none;
        }

        .secondary-btn {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 28px;
          color: #374151;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 640px) {
          .secondary-btn {
            padding: 12px 20px;
            font-size: 14px;
          }
        }

        .secondary-btn:hover {
          border-color: #8b5cf6;
          background: #faf5ff;
          color: #7c3aed;
          transform: translateY(-1px);
        }

        @media (hover: none) {
          .secondary-btn:hover {
            transform: none;
          }
        }

        .question-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-left: 3px solid;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 16px;
          transition: all 0.3s ease;
          animation: slideIn 0.4s ease-out;
        }

        @media (max-width: 640px) {
          .question-card {
            padding: 16px;
          }
        }

        .question-card:hover {
          background: #fafafa;
          border-color: #d1d5db;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        @media (hover: none) {
          .question-card:hover {
            transform: none;
          }
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          margin: 48px 0;
        }

        @media (max-width: 640px) {
          .divider {
            margin: 32px 0;
          }
        }

        .gradient-text {
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div style={{ 
        maxWidth: '1100px', 
        margin: '0 auto', 
        padding: '60px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ position: 'relative' }}>
          {/* User Profile Button */}
          <div style={{ 
            position: 'absolute',
            top: '10px',
            right: '0',
            zIndex: 10
          }}
          className="user-profile-btn"
          >
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.displayName || user.username}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700
                    }}>
                      {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{user?.displayName || user?.username}</span>
                </button>
                {/* Dropdown Menu */}
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  padding: '8px',
                  minWidth: '200px',
                  display: 'none'
                }}
                className="profile-dropdown"
                >
                  <div style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {user?.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.displayName || user.username}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#ffffff'
                      }}>
                        {(user?.displayName || user?.username)?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#1f2937',
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '2px'
                      }}>
                        {user?.displayName || user?.username}
                      </div>
                      <div style={{ 
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <div style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      High Scores
                    </div>
                    {user?.highScores?.length > 0 ? (
                      user.highScores.slice(0, 3).map((score, index) => (
                        <div key={index} style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontFamily: "'Inter', sans-serif",
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ color: '#6b7280' }}>
                            {score.topic.substring(0, 20)}...
                          </span>
                          <span style={{ 
                            fontWeight: 700,
                            color: '#8b5cf6'
                          }}>
                            {score.score}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        color: '#9ca3af',
                        fontStyle: 'italic',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        No high scores yet
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '4px'
                  }}>
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ef4444',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background 0.2s'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          {/* Logo with white bubble background */}
          <div style={{
            display: 'inline-block',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px 36px 16px 36px',
            paddingRight: '50px',
            marginBottom: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            <div className="playful-pop-logo" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="trivia">Trivia</span><span className="iq">IQ</span>
            </div>
          </div>
          
          <p style={{ 
            fontSize: 'clamp(15px, 3vw, 18px)', 
            color: 'rgba(255, 255, 255, 0.95)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.7',
            fontWeight: 500,
            padding: '0 16px'
          }}>
            Generate trivia questions about ANY topic in seconds! Choose from guided topics or customize your own, and test your knowledge with daily mini-games. The possibilities are endless!
          </p>

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '32px'
          }}>
            <button
              onClick={() => {
                const element = document.getElementById('guided-topics');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
              }}
              className="nav-button"
            >
              <List size={18} />
              Guided Topics
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('custom-topic');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
              }}
              className="nav-button"
            >
              <Wand2 size={18} />
              Custom Topic
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('mini-game');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
              }}
              className="nav-button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Quiz
            </button>
          </div>
          </div>
        </div>

        {/* Home Screen - Both options on one page */}
        {step === 'home' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', marginTop: '32px' }}>
            {/* Guided Selection Section */}
            <div className="trivia-container" id="guided-topics" style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <List size={24} style={{ color: '#ec4899' }} />
                <h2 style={{ 
                  fontFamily: "'Space Grotesk', monospace",
                  fontSize: '26px',
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '-0.01em'
                }} className="gradient-text">
                  Guided Topics
                </h2>
              </div>
              <p style={{ 
                color: '#6b7280',
                marginBottom: '28px',
                lineHeight: '1.6',
                fontSize: '15px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Browse categories and refine your selection for targeted trivia.
              </p>

              {/* Topic Grid */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif",
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Choose Topic
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`topic-btn ${selectedTopic === topic.id ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectedTopic === topic.id) {
                          // Unselect if clicking the same topic
                          setSelectedTopic(null);
                          setSelectedSubtopic(null);
                          setSelectedGenre(null);
                        } else {
                          // Select new topic
                          setSelectedTopic(topic.id);
                          setSelectedSubtopic(null);
                          setSelectedGenre(null);
                          scrollToNextSection();
                        }
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{topic.emoji}</div>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: '14px',
                        color: '#1f2937'
                      }}>
                        {topic.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtopic Selection */}
              {selectedTopic && (
                <div style={{ 
                  marginBottom: '28px',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  <label style={{ 
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif"
                  }}>
                    Choose Subtopic
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px'
                  }}>
                    {topics.find(t => t.id === selectedTopic).subtopics.map((subtopic) => (
                      <button
                        key={subtopic.name}
                        className={`topic-btn ${selectedSubtopic === subtopic.name ? 'selected' : ''}`}
                        onClick={() => {
                          if (selectedSubtopic === subtopic.name) {
                            // Unselect if clicking the same subtopic
                            setSelectedSubtopic(null);
                            setSelectedGenre(null);
                          } else {
                            // Select new subtopic
                            setSelectedSubtopic(subtopic.name);
                            setSelectedGenre(null);
                            scrollToNextSection();
                          }
                        }}
                        style={{ 
                          padding: '12px',
                          width: '100%',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#1f2937',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      >
                        {subtopic.emoji} {subtopic.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Genre Selector for Movies and Music */}
              {selectedTopic && selectedSubtopic && genreOptions[selectedSubtopic] && (
                <div style={{ 
                  marginBottom: '28px',
                  animation: 'slideIn 0.3s ease-out' 
                }}>
                  <label style={{ 
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif"
                  }}>
                    Choose Genre (Optional)
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px'
                  }}>
                    {genreOptions[selectedSubtopic].map((genre) => (
                      <button
                        key={genre}
                        className={`topic-btn ${selectedGenre === genre ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedGenre(selectedGenre === genre ? null : genre);
                          if (selectedGenre !== genre) {
                            scrollToNextSection();
                          }
                        }}
                        style={{ 
                          padding: '12px',
                          width: '100%',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#1f2937',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  <p style={{ 
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '8px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {selectedGenre ? 'Click again to deselect' : 'Skip to generate general questions'}
                  </p>
                </div>
              )}

              {/* Difficulty Selector for Guided */}
              {selectedTopic && selectedSubtopic && (
                <div style={{ 
                  marginBottom: '28px',
                  animation: 'slideIn 0.3s ease-out' 
                }}>
                  <label style={{ 
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif"
                  }}>
                    Difficulty Level
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px'
                  }}>
                    {['easy', 'medium', 'hard', 'impossible'].map((diff) => (
                      <div
                        key={diff}
                        className={`difficulty-btn ${selectedDifficulty === diff ? `selected ${diff}` : ''}`}
                        onClick={() => {
                          setSelectedDifficulty(diff);
                          scrollToNextSection(200);
                        }}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Count Selector for Guided */}
              {selectedTopic && selectedSubtopic && (
                <div style={{ 
                  marginBottom: '28px',
                  animation: 'slideIn 0.3s ease-out' 
                }}>
                  <label style={{ 
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif"
                  }}>
                    Number of Questions
                  </label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                  }}>
                    {[10, 25, 50].map((count) => (
                      <div
                        key={count}
                        className={`difficulty-btn ${questionCount === count ? 'selected medium' : ''}`}
                        onClick={() => {
                          setQuestionCount(count);
                          scrollToNextSection(200);
                        }}
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {selectedTopic && selectedSubtopic && (
                <div style={{ animation: 'slideIn 0.3s ease-out' }}>
                  <button
                    className="primary-btn"
                    onClick={handleGuidedGenerate}
                  >
                    <Sparkles size={18} />
                    Generate Questions
                  </button>
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Custom Topic Section */}
            <div className="trivia-container" id="custom-topic">
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <Wand2 size={24} style={{ color: '#8b5cf6' }} />
                <h2 style={{ 
                  fontFamily: "'Space Grotesk', monospace",
                  fontSize: '26px',
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '-0.01em'
                }} className="gradient-text">
                  Custom Topic
                </h2>
              </div>
              <p style={{ 
                color: '#6b7280',
                marginBottom: '24px',
                lineHeight: '1.6',
                fontSize: '15px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Describe any topic and AI will generate tailored trivia questions.
              </p>
              <input
                className="custom-input"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && customPrompt.trim() && handleCustomSubmit()}
                placeholder="e.g., 'obscure facts about 1980s arcade games' or 'deep sea biology'"
                style={{ marginBottom: '24px' }}
              />
              
              {/* Difficulty Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Difficulty Level
                </label>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px'
                }}>
                  {['easy', 'medium', 'hard', 'impossible'].map((diff) => (
                    <div
                      key={diff}
                      className={`difficulty-btn ${selectedDifficulty === diff ? `selected ${diff}` : ''}`}
                      onClick={() => {
                        setSelectedDifficulty(diff);
                        scrollToNextSection(200, 'custom-topic');
                      }}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Count Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Number of Questions
                </label>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {[10, 25, 50].map((count) => (
                    <div
                      key={count}
                      className={`difficulty-btn ${questionCount === count ? 'selected medium' : ''}`}
                      onClick={() => {
                        setQuestionCount(count);
                        scrollToNextSection(200, 'custom-topic');
                      }}
                    >
                      {count}
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="primary-btn"
                onClick={handleCustomSubmit}
                disabled={!customPrompt.trim()}
              >
                <Sparkles size={18} />
                Generate Questions
              </button>
            </div>

            <div className="divider" />

            {/* Mini-Game Section */}
            <div className="trivia-container" id="mini-game">
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h2 style={{ 
                  fontFamily: "'Space Grotesk', monospace",
                  fontSize: '26px',
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '-0.01em'
                }} className="gradient-text">
                  Want to test your knowledge?
                </h2>
              </div>
              <p style={{ 
                color: '#6b7280',
                marginBottom: '28px',
                lineHeight: '1.6',
                fontSize: '15px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Play a rapid-fire timed quiz! Answer as many questions as you can before time runs out.
              </p>

              {gameStep === 'setup' && (
                <>
                  {/* Topic Selection - Same as Guided */}
                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ 
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Choose Topic
                    </label>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '12px'
                    }}>
                      {topics.map((topic) => (
                        <div
                          key={topic.id}
                          className={`topic-btn ${gameTopic === topic.id ? 'selected' : ''}`}
                          onClick={() => {
                            if (gameTopic === topic.id) {
                              // Unselect if clicking the same topic
                              setGameTopic(null);
                              setGameSubtopic(null);
                              setGameGenre(null);
                            } else {
                              // Select new topic
                              setGameTopic(topic.id);
                              setGameSubtopic(null);
                              setGameGenre(null);
                              scrollToNextSection(300, 'mini-game');
                            }
                          }}
                        >
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{topic.emoji}</div>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: '14px',
                            color: '#1f2937'
                          }}>
                            {topic.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtopic Selection */}
                  {gameTopic && (
                    <div style={{ 
                      marginBottom: '28px',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Choose Subtopic
                      </label>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px'
                      }}>
                        {topics.find(t => t.id === gameTopic).subtopics.map((subtopic) => (
                          <button
                            key={subtopic.name}
                            className={`topic-btn ${gameSubtopic === subtopic.name ? 'selected' : ''}`}
                            onClick={() => {
                              if (gameSubtopic === subtopic.name) {
                                // Unselect if clicking the same subtopic
                                setGameSubtopic(null);
                                setGameGenre(null);
                              } else {
                                // Select new subtopic
                                setGameSubtopic(subtopic.name);
                                setGameGenre(null);
                                scrollToNextSection(300, 'mini-game');
                              }
                            }}
                            style={{ 
                              padding: '12px',
                              width: '100%',
                              textAlign: 'left',
                              fontWeight: 600,
                              fontSize: '14px',
                              color: '#1f2937',
                              fontFamily: "'Inter', sans-serif"
                            }}
                          >
                            {subtopic.emoji} {subtopic.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Genre Selection */}
                  {gameTopic && gameSubtopic && genreOptions[gameSubtopic] && (
                    <div style={{ 
                      marginBottom: '28px',
                      animation: 'slideIn 0.3s ease-out' 
                    }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Choose Genre (Optional)
                      </label>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '10px'
                      }}>
                        {genreOptions[gameSubtopic].map((genre) => (
                          <button
                            key={genre}
                            className={`topic-btn ${gameGenre === genre ? 'selected' : ''}`}
                            onClick={() => {
                              setGameGenre(gameGenre === genre ? null : genre);
                              if (gameGenre !== genre) {
                                scrollToNextSection(300, 'mini-game');
                              }
                            }}
                            style={{ 
                              padding: '12px',
                              width: '100%',
                              fontWeight: 600,
                              fontSize: '14px',
                              color: '#1f2937',
                              fontFamily: "'Inter', sans-serif"
                            }}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Difficulty Selection */}
                  {gameTopic && gameSubtopic && (
                    <div style={{ 
                      marginBottom: '28px',
                      animation: 'slideIn 0.3s ease-out' 
                    }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Difficulty Level
                      </label>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '10px'
                      }}>
                        {['easy', 'medium', 'hard', 'impossible'].map((diff) => (
                          <div
                            key={diff}
                            className={`difficulty-btn ${gameDifficulty === diff ? `selected ${diff}` : ''}`}
                            onClick={() => {
                              setGameDifficulty(diff);
                              scrollToNextSection(200, 'mini-game');
                            }}
                          >
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Selection */}
                  {gameTopic && gameSubtopic && (
                    <div style={{ 
                      marginBottom: '28px',
                      animation: 'slideIn 0.3s ease-out' 
                    }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Game Time
                      </label>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px'
                      }}>
                        {[30, 60].map((time) => (
                          <div
                            key={time}
                            className={`difficulty-btn ${gameTime === time ? 'selected medium' : ''}`}
                            onClick={() => {
                              setGameTime(time);
                              scrollToNextSection(200, 'mini-game');
                            }}
                          >
                            {time} Seconds
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Start Game Button */}
                  {gameTopic && gameSubtopic && (
                    <div style={{ animation: 'slideIn 0.3s ease-out' }}>
                      <button
                        className="primary-btn"
                        onClick={startGame}
                        style={{ width: '100%' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Start Game
                      </button>
                    </div>
                  )}
                </>
              )}

              {gameStep === 'generating' && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Loader2 size={48} style={{ 
                    color: '#8b5cf6',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                  }} />
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Preparing your game...
                  </p>
                </div>
              )}

              {gameStep === 'playing' && gameQuestions.length > 0 && (
                <div>
                  {/* Timer and Score Header */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    padding: '16px',
                    background: timeRemaining <= 10 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    transition: 'background 0.3s ease'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.9, 
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '4px'
                      }}>
                        TIME REMAINING
                      </div>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: 700, 
                        fontFamily: "'Space Grotesk', monospace",
                        lineHeight: 1,
                        animation: timeRemaining <= 10 ? 'pulse 1s infinite' : 'none'
                      }}>
                        {timeRemaining}s
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        opacity: 0.9, 
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '4px'
                      }}>
                        SCORE
                      </div>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: 700, 
                        fontFamily: "'Space Grotesk', monospace",
                        lineHeight: 1
                      }}>
                        {gameScore}
                      </div>
                    </div>
                  </div>

                  <style>{`
                    @keyframes pulse {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.05); }
                    }
                  `}</style>

                  {/* Question Progress */}
                  <div style={{ 
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#6b7280',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600
                  }}>
                    Question {currentQuestionIndex + 1} of {gameQuestions.length}
                  </div>

                  {/* Current Question */}
                  <div style={{ 
                    marginBottom: '24px',
                    padding: '24px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#1f2937',
                      marginBottom: '24px',
                      lineHeight: '1.4',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {gameQuestions[currentQuestionIndex].question}
                    </h3>

                    {/* Answer Options */}
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {gameQuestions[currentQuestionIndex].options.map((option, index) => {
                        const isSelected = selectedAnswerFeedback?.index === index;
                        const isCorrectAnswer = index === gameQuestions[currentQuestionIndex].correctAnswer;
                        const showFeedback = selectedAnswerFeedback !== null;
                        
                        let buttonStyle = {
                          padding: '16px',
                          background: '#ffffff',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1f2937',
                          cursor: showFeedback ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          fontFamily: "'Inter', sans-serif",
                          opacity: showFeedback ? 0.6 : 1
                        };

                        // Show feedback colors
                        if (showFeedback) {
                          if (isSelected && selectedAnswerFeedback.isCorrect) {
                            // Correct answer - green
                            buttonStyle = {
                              ...buttonStyle,
                              background: '#dcfce7',
                              borderColor: '#22c55e',
                              opacity: 1
                            };
                          } else if (isSelected && !selectedAnswerFeedback.isCorrect) {
                            // Wrong answer - red
                            buttonStyle = {
                              ...buttonStyle,
                              background: '#fee2e2',
                              borderColor: '#ef4444',
                              opacity: 1
                            };
                          } else if (!isSelected && isCorrectAnswer && !selectedAnswerFeedback.isCorrect) {
                            // Show correct answer when user got it wrong - subtle green
                            buttonStyle = {
                              ...buttonStyle,
                              background: '#dcfce7',
                              borderColor: '#86efac',
                              opacity: 1
                            };
                          }
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => !showFeedback && handleGameAnswer(index)}
                            style={buttonStyle}
                            className="answer-option"
                            disabled={showFeedback}
                          >
                            <span style={{ 
                              display: 'inline-block',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: isSelected && showFeedback
                                ? (selectedAnswerFeedback.isCorrect ? '#22c55e' : '#ef4444')
                                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              color: '#ffffff',
                              textAlign: 'center',
                              lineHeight: '28px',
                              marginRight: '12px',
                              fontSize: '14px'
                            }}>
                              {isSelected && showFeedback
                                ? (selectedAnswerFeedback.isCorrect ? '✓' : '✗')
                                : String.fromCharCode(65 + index)}
                            </span>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {gameStep === 'results' && (
                <div>
                  {/* Final Score */}
                  <div style={{ 
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                    borderRadius: '16px',
                    marginBottom: '32px',
                    color: '#ffffff'
                  }}>
                    <div style={{ 
                      fontSize: '48px',
                      marginBottom: '8px'
                    }}>
                      🎉
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      opacity: 0.9,
                      marginBottom: '8px',
                      fontFamily: "'Inter', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Final Score
                    </div>
                    <div style={{ 
                      fontSize: '72px',
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', monospace",
                      marginBottom: '16px'
                    }}>
                      {gameScore}
                    </div>
                    <div style={{ 
                      fontSize: '16px',
                      opacity: 0.9,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {answeredQuestions.filter(q => q.isCorrect).length} / {answeredQuestions.length} Correct
                    </div>
                    
                    {/* High Score Status */}
                    {isAuthenticated ? (
                      <div style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        ✓ Score saved to your profile!
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          Sign in to save your high scores!
                        </div>
                        <button
                          onClick={() => setShowAuthModal(true)}
                          style={{
                            padding: '6px 12px',
                            background: '#ffffff',
                            color: '#8b5cf6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Inter', sans-serif"
                          }}
                        >
                          Sign In Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Results Breakdown */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '20px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      fontFamily: "'Space Grotesk', monospace"
                    }}>
                      Results Breakdown
                    </h3>
                    <div style={{ 
                      display: 'grid',
                      gap: '12px'
                    }}>
                      {answeredQuestions.map((q, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '16px',
                            background: q.isCorrect ? '#f0fdf4' : '#fef2f2',
                            border: `2px solid ${q.isCorrect ? '#86efac' : '#fca5a5'}`,
                            borderRadius: '10px'
                          }}
                        >
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              fontSize: '20px'
                            }}>
                              {q.isCorrect ? '✅' : '❌'}
                            </div>
                            <div style={{ 
                              flex: 1,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#1f2937',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              {q.question}
                            </div>
                            <div style={{ 
                              fontSize: '16px',
                              fontWeight: 700,
                              color: q.isCorrect ? '#16a34a' : '#dc2626',
                              fontFamily: "'Space Grotesk', monospace"
                            }}>
                              +{q.points}
                            </div>
                          </div>
                          {!q.isCorrect && (
                            <div style={{ 
                              fontSize: '13px',
                              color: '#6b7280',
                              marginTop: '8px',
                              paddingLeft: '32px',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              Correct answer: {q.correctAnswer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Play Again Button */}
                  <button
                    className="primary-btn"
                    onClick={() => {
                      setGameStep('setup');
                      setGameScore(0);
                      setAnsweredQuestions([]);
                      setCurrentQuestionIndex(0);
                    }}
                    style={{ width: '100%' }}
                  >
                    <RotateCcw size={18} />
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSS for answer options hover */}
        <style>{`
          .answer-option:hover {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05)) !important;
            border-color: #8b5cf6 !important;
            transform: translateX(4px);
          }

          .nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(236, 72, 153, 0.4) !important;
            filter: brightness(1.1);
          }

          @media (hover: none) {
            .nav-button:hover {
              transform: none;
            }
          }

          .footer-link:hover {
            background: rgba(255, 255, 255, 0.3) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          @media (hover: none) {
            .footer-link:hover {
              transform: none;
            }
          }

          /* Mobile-specific fixes */
          @media (max-width: 640px) {
            .user-profile-btn {
              top: 60px !important;
              right: 16px !important;
            }
            
            .user-profile-btn button {
              padding: 8px 16px !important;
              font-size: 13px !important;
            }
            
            /* Prevent button highlighting on scroll */
            .topic-btn {
              touch-action: manipulation;
              -webkit-tap-highlight-color: transparent;
            }
            
            .topic-btn:active {
              background: #f9fafb !important;
            }
          }
        `}</style>

        {/* Generating State */}
        {step === 'generating' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div className="trivia-container">
              <Loader2 size={56} style={{ 
                color: '#8b5cf6',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 24px',
                filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))'
              }} />
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <h2 style={{ 
                fontFamily: "'Space Grotesk', monospace",
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '12px',
                letterSpacing: '-0.01em'
              }} className="gradient-text">
                Generating Trivia...
              </h2>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '15px',
                fontWeight: 500 
              }}>
                Creating {questionCount} {selectedDifficulty} questions
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && triviaQuestions.length > 0 && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ 
              background: '#ffffff',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <h2 style={{ 
                    fontFamily: "'Space Grotesk', monospace",
                    fontSize: '36px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em'
                  }} className="gradient-text">
                    Your Questions
                  </h2>
                  <p style={{ 
                    color: '#6b7280',
                    fontSize: '14px',
                    margin: 0,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {triviaQuestions.length} Questions · {selectedDifficulty} Difficulty
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    className="secondary-btn"
                    onClick={reset}
                    style={{ gap: '8px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    Home
                  </button>
                  <button
                    className="primary-btn"
                    onClick={handleRegenerateQuestions}
                  >
                    <Sparkles size={18} />
                    New Set
                  </button>
                </div>
              </div>
            </div>

            {/* Difficulty Selector on Results Page */}
            <div style={{ marginBottom: '40px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#374151',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                  fontFamily: "'Inter', sans-serif",
                fontFamily: "'Inter', sans-serif"
              }}>
                Adjust Difficulty
              </label>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                maxWidth: '600px'
              }}>
                {['easy', 'medium', 'hard', 'impossible'].map((diff) => (
                  <div
                    key={diff}
                    className={`difficulty-btn ${selectedDifficulty === diff ? `selected ${diff}` : ''}`}
                    onClick={() => setSelectedDifficulty(diff)}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </div>
                ))}
              </div>
              <p style={{ 
                fontSize: '13px',
                color: '#6b7280',
                marginTop: '12px',
                fontFamily: "'Inter', sans-serif"
              }}>
                Select a difficulty level, then click "New Set" to regenerate
              </p>
            </div>
            
            {triviaQuestions.map((q, index) => (
              <div 
                key={index}
                className="question-card"
                style={{ 
                  borderLeftColor: 'transparent',
                  borderImage: getDifficultyColor(q.difficulty),
                  borderImageSlice: 1,
                  animationDelay: `${index * 0.06}s`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ 
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#9ca3af',
                    letterSpacing: '0.1em'
                  }}>
                    QUESTION {String(index + 1).padStart(2, '0')}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ 
                      fontSize: '11px',
                      padding: '5px 12px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '6px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {q.category}
                    </span>
                    <span style={{ 
                      fontSize: '11px',
                      padding: '5px 12px',
                      background: getDifficultyColor(q.difficulty),
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
                    }}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  lineHeight: '1.6',
                  color: '#1f2937'
                }}>
                  {q.question}
                </div>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{ 
                    color: '#8b5cf6',
                    fontSize: '14px',
                    fontWeight: 700,
                    userSelect: 'none',
                    listStyle: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.2s'
                  }}>
                    <ChevronRight size={16} style={{ 
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }} />
                    Reveal Answer
                  </summary>
                  <div style={{ 
                    marginTop: '16px',
                    padding: '16px 18px',
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: '10px',
                    color: '#1f2937',
                    fontWeight: 500,
                    fontSize: '15px',
                    lineHeight: '1.7'
                  }}>
                    {q.answer}
                  </div>
                </details>
                <style>{`
                  details[open] summary {
                    color: #7c3aed !important;
                  }
                  details[open] summary svg {
                    transform: rotate(90deg);
                  }
                  summary:hover {
                    color: #6d28d9 !important;
                  }
                `}</style>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        color: '#ffffff',
        padding: '40px 24px',
        marginTop: '40px',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Logo */}
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: "'Poppins', sans-serif"
          }}>
            <span style={{ color: '#ffffff' }}>Trivia</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #ffffff, rgba(255, 255, 255, 0.7))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>IQ</span>
          </div>

          {/* Social & Actions */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Scroll to Top Button */}
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="footer-link"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              Back to Top
            </button>

            {/* Instagram Link */}
            <a
              href="https://www.instagram.com/triviaiq.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s'
              }}
              className="footer-link"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Follow Us
            </a>
          </div>

          {/* Copyright */}
          <div style={{
            fontSize: '13px',
            opacity: 0.8,
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            © 2026 TriviaIQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
