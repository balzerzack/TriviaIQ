# 🎯 TriviaIQ

AI-powered trivia question generator with timed quiz games and high score tracking.

![TriviaIQ](https://img.shields.io/badge/React-18.2-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🎮 **15 Main Topics** - 105+ subtopics, 600+ genre options including History, Science, Entertainment, Sports, and more
- 🤖 **AI-Powered** - Claude Sonnet 4 generates unique, high-quality trivia questions
- ⏱️ **Timed Mini-Games** - 30 or 60 second rapid-fire quizzes with scoring
- 🏆 **High Score Tracking** - Google OAuth authentication with persistent leaderboards
- 🎚️ **4 Difficulty Levels** - Easy, Medium, Hard, and Impossible
- 📱 **Mobile Optimized** - Fully responsive design works on all devices
- 🎨 **Beautiful UI** - Purple gradient design with smooth animations
- 🔍 **SEO Optimized** - Structured data for search engines and AI tools

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/triviaiq.git
cd triviaiq

# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

## 🔧 Technologies

- **Frontend**: React 18, Lucide React (icons)
- **Authentication**: Google Identity Services (OAuth 2.0)
- **AI**: Claude Sonnet 4 API (Anthropic)
- **Styling**: Custom CSS with gradient effects
- **Deployment**: Vercel (recommended)

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/triviaiq)

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build command: `npm run build`
6. Publish directory: `build`
7. Click "Deploy site"

## 🔐 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google Identity Services"
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://triviaiq.app` (production)
6. Copy the Client ID
7. Replace `YOUR_GOOGLE_CLIENT_ID` in `src/App.js` with your Client ID

```javascript
const GOOGLE_CLIENT_ID = 'your-client-id-here.apps.googleusercontent.com';
```

### Environment Variables (Optional)

Create a `.env` file in the root directory:

```bash
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
```

Then use in code:
```javascript
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
```

## 📂 Project Structure

```
triviaiq/
├── public/
│   ├── index.html          # HTML with SEO tags
│   ├── manifest.json       # PWA manifest
│   └── robots.txt          # SEO robots file
├── src/
│   ├── App.js              # Main TriviaIQ component
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🎮 How to Use

1. **Choose a Mode**:
   - **Guided Topics**: Browse 15 categories → Select subtopic → Choose genre → Set difficulty
   - **Custom Topic**: Enter any custom prompt for AI-generated questions
   - **Quiz Game**: Timed challenge with score tracking

2. **Set Parameters**:
   - Choose difficulty: Easy, Medium, Hard, or Impossible
   - Select question count: 10, 25, or 50 questions
   - For quiz game: Choose 30 or 60 second timer

3. **Generate & Play**:
   - Click "Generate Questions" to create trivia
   - Answer questions in the quiz game mode
   - Track your high scores (requires Google sign-in)

## 🎯 Features in Detail

### Guided Topics
15 main categories including:
- 📚 History (Ancient, Modern, Wars, etc.)
- 🔬 Science (Physics, Biology, Chemistry, etc.)
- 🎬 Entertainment (Movies, TV Shows, Music, etc.)
- 🌍 Geography (Countries, Capitals, Landmarks, etc.)
- ⚽ Sports (Football, Basketball, Golf, Tennis, etc.)
- And 10 more categories with 600+ genre options!

### AI-Powered Questions
- Unique questions generated for each session
- Difficulty-calibrated (Easy to Impossible)
- Anti-duplicate system prevents repetition
- Factually accurate with verification

### Mini-Game Features
- Rapid-fire multiple choice questions
- Real-time countdown timer
- Speed-based bonus scoring (answer faster = more points)
- Visual feedback (green for correct, red for wrong)
- High score leaderboard
- Challenge friends via SMS/share

### User Accounts
- Google OAuth sign-in
- Profile pictures displayed
- High score tracking
- Persistent sessions
- Cross-device sync ready

## 🔒 Privacy & Security

- User data stored securely in localStorage (can be upgraded to Firebase)
- Google handles all authentication
- No passwords stored for OAuth users
- HTTPS required for production
- No tracking cookies (analytics optional)

## 📊 Analytics (Optional)

Add Google Analytics by uncommenting in `public/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 TriviaIQ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Authentication by [Google Identity Services](https://developers.google.com/identity)

## 📧 Contact

For questions or support, please open an issue on GitHub or contact [@triviaiq.app](https://instagram.com/triviaiq.app)

---

Made with ❤️ and AI
