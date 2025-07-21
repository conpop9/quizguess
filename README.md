# Quiz Guess - Daily Quiz Prediction Game

A minimalistic black and white web application for predicting daily quizzes.

## Features

### User Features
- **Sign In**: Users enter their name and roll number (roll number acts as unique identifier)
- **Daily Voting**: Users can vote once per day between 12:00 AM to 1:30 PM
- **Quiz Prediction**: Users predict if a quiz will happen and which subject
- **Live Results**: Real-time visualization of all votes
- **Score Tracking**: Points are awarded based on correct predictions

### Admin Features
- **Set Results**: Administrator can set the actual quiz outcome
- **Score Calculation**: Automatic score calculation and distribution

## Quiz Subjects
- FRA
- LAB
- Qm-1a
- ID
- ME
- HRM
- MGRCMP

## Scoring System
- **No Quiz**: +1 point for correctly guessing no quiz
- **Quiz Happened**: 
  - +1 point for correctly guessing quiz would happen
  - +2 points total for correctly guessing both quiz happening AND the subject

## Time Restrictions
- Voting is only allowed from 12:00 AM to 8:30 PM
- Users can only vote once per day
- After voting, users can see live results

## Leaderboard
- Shows cumulative scores of all users
- Top 5 users displayed on main page
- Full leaderboard available in dedicated section
- Users ranked by total points earned

## How to Use

### For Users
1. Open `index.html` in a web browser
2. Enter your name and roll number to sign in
3. If within voting hours (12:00 AM - 8:30 PM):
   - Select "Yes" or "No" for whether a quiz will happen
   - If "Yes", select which quiz subject
   - Submit your vote
4. View live results showing all votes
5. Check your score in the top right
6. View leaderboard to see rankings

### For Administrators
1. Sign in as any user
2. Click "Admin" in the navigation
3. Set whether a quiz actually happened
4. If yes, select which quiz happened
5. Click "Set Result & Calculate Scores"
6. All user scores will be automatically updated

## Technical Details
- **Backend**: Node.js with Express server
- **Database**: JSON file storage (easily upgradeable to SQL/NoSQL)
- **Frontend**: Responsive HTML, CSS, and JavaScript
- **Real-time Updates**: Automatic data synchronization every 10 seconds
- **Minimalistic Design**: Clean black and white theme

## Files
- `server.js` - Backend server with API endpoints
- `package.json` - Node.js dependencies
- `public/index.html` - Main application structure
- `public/styles.css` - Minimalistic styling
- `public/script.js` - Frontend logic with API calls
- `data/` - Database files (auto-created)

## Data Storage
All data is stored in JSON files on the server:
- `votes.json` - Daily voting data
- `scores.json` - User cumulative scores
- `results.json` - Admin-set quiz results

## Deployment
Ready for deployment on any hosting platform:
- Heroku, Railway, Netlify, DigitalOcean
- See `DEPLOYMENT.md` for detailed instructions
- Environment variables support for production

## API Endpoints
- `GET /api/user/:rollNumber` - Get user data
- `POST /api/vote` - Submit vote
- `GET /api/results` - Get live results
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/admin/set-result` - Set quiz results (admin) 