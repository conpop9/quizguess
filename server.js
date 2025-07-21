const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from public directory

// Database file paths
const DATA_DIR = './data';
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const SLEEP_FILE = path.join(DATA_DIR, 'sleep.json');
const COUNTER_FILE = path.join(DATA_DIR, 'counter.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
function initializeDataFiles() {
    if (!fs.existsSync(VOTES_FILE)) {
        fs.writeFileSync(VOTES_FILE, JSON.stringify({}));
    }
    if (!fs.existsSync(SCORES_FILE)) {
        fs.writeFileSync(SCORES_FILE, JSON.stringify({}));
    }
    if (!fs.existsSync(RESULTS_FILE)) {
        fs.writeFileSync(RESULTS_FILE, JSON.stringify({}));
    }
    if (!fs.existsSync(SLEEP_FILE)) {
        fs.writeFileSync(SLEEP_FILE, JSON.stringify({}));
    }
    if (!fs.existsSync(COUNTER_FILE)) {
        fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: 0, date: '' }));
    }
}

// Helper functions to read/write data
function readData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return {};
    }
}

function writeData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Get current date string
function getCurrentDate() {
    return new Date().toDateString();
}

// Check if time is within voting hours (12:00 AM to 1:45 PM)
function isVotingTimeValid() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    return (currentHour < 13) || (currentHour === 13 && currentMinute <= 45);
}

// API Routes

// Get user data (score and voting status)
app.get('/api/user/:rollNumber', (req, res) => {
    const { rollNumber } = req.params;
    const today = getCurrentDate();
    
    const scores = readData(SCORES_FILE);
    const votes = readData(VOTES_FILE);
    
    const userScore = scores[rollNumber] || 0;
    const todayVotes = votes[today] || [];
    const userVotedToday = todayVotes.find(vote => vote.rollNumber === rollNumber);
    
    res.json({
        score: userScore,
        hasVotedToday: !!userVotedToday,
        vote: userVotedToday || null,
        votingTimeValid: isVotingTimeValid()
    });
});

// Submit vote
app.post('/api/vote', (req, res) => {
    const { rollNumber, name, quizHappens, quizSubject } = req.body;
    
    if (!rollNumber || !name || quizHappens === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!isVotingTimeValid()) {
        return res.status(400).json({ error: 'Voting is not allowed at this time' });
    }
    
    const today = getCurrentDate();
    const votes = readData(VOTES_FILE);
    
    if (!votes[today]) {
        votes[today] = [];
    }
    
    // Check if user already voted today
    const existingVote = votes[today].find(vote => vote.rollNumber === rollNumber);
    if (existingVote) {
        return res.status(400).json({ error: 'You have already voted today' });
    }
    
    // Add new vote
    const vote = {
        rollNumber,
        name,
        quizHappens,
        quizSubject: quizSubject || null,
        timestamp: new Date().toISOString()
    };
    
    votes[today].push(vote);
    
    if (writeData(VOTES_FILE, votes)) {
        res.json({ success: true, message: 'Vote submitted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save vote' });
    }
});

// Get live results
app.get('/api/results', (req, res) => {
    const today = getCurrentDate();
    const votes = readData(VOTES_FILE);
    const todayVotes = votes[today] || [];
    
    if (todayVotes.length === 0) {
        return res.json({
            totalVotes: 0,
            yesVotes: 0,
            noVotes: 0,
            subjectVotes: {}
        });
    }
    
    const yesVotes = todayVotes.filter(vote => vote.quizHappens).length;
    const noVotes = todayVotes.filter(vote => !vote.quizHappens).length;
    
    const subjectVotes = {};
    todayVotes.forEach(vote => {
        if (vote.quizHappens && vote.quizSubject) {
            subjectVotes[vote.quizSubject] = (subjectVotes[vote.quizSubject] || 0) + 1;
        }
    });
    
    res.json({
        totalVotes: todayVotes.length,
        yesVotes,
        noVotes,
        subjectVotes
    });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    const scores = readData(SCORES_FILE);
    const votes = readData(VOTES_FILE);
    
    // Get user names from votes
    const userNames = {};
    Object.values(votes).forEach(dailyVotes => {
        dailyVotes.forEach(vote => {
            if (!userNames[vote.rollNumber]) {
                userNames[vote.rollNumber] = vote.name;
            }
        });
    });
    
    // Create leaderboard
    const leaderboard = Object.entries(scores).map(([rollNumber, score]) => ({
        rollNumber,
        name: userNames[rollNumber] || `User ${rollNumber}`,
        score
    }));
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    res.json(leaderboard);
});

// Admin: Set results and calculate scores
app.post('/api/admin/set-result', (req, res) => {
    const { quizHappened, quizSubject } = req.body;
    
    if (quizHappened === undefined) {
        return res.status(400).json({ error: 'quizHappened is required' });
    }
    
    if (quizHappened && !quizSubject) {
        return res.status(400).json({ error: 'quizSubject is required when quiz happened' });
    }
    
    const today = getCurrentDate();
    const votes = readData(VOTES_FILE);
    const scores = readData(SCORES_FILE);
    const results = readData(RESULTS_FILE);
    
    const todayVotes = votes[today] || [];
    
    if (todayVotes.length === 0) {
        return res.status(400).json({ error: 'No votes to process for today' });
    }
    
    // Calculate scores
    todayVotes.forEach(vote => {
        const currentScore = scores[vote.rollNumber] || 0;
        let pointsEarned = 0;
        
        if (!quizHappened) {
            // If no quiz happened, +1 for correct guess
            if (!vote.quizHappens) {
                pointsEarned = 1;
            }
        } else {
            // If quiz happened
            if (vote.quizHappens) {
                pointsEarned = 1; // +1 for correctly guessing quiz would happen
                
                // +2 total (so +1 more) for correctly guessing the subject
                if (vote.quizSubject === quizSubject) {
                    pointsEarned = 2;
                }
            }
        }
        
        scores[vote.rollNumber] = currentScore + pointsEarned;
    });
    
    // Save results
    results[today] = {
        quizHappened,
        quizSubject: quizSubject || null,
        processedAt: new Date().toISOString()
    };
    
    if (writeData(SCORES_FILE, scores) && writeData(RESULTS_FILE, results)) {
        res.json({ success: true, message: 'Results processed and scores updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save results' });
    }
});

// =================== SLEEP TRACKER ROUTES ===================

// Get sleep data for a specific date (all periods)
app.get('/api/sleep-data/:date', (req, res) => {
    const { date } = req.params;
    
    const sleepData = readData(SLEEP_FILE);
    
    res.json({
        sleepData: sleepData[date] || {}
    });
});

// Save sleep data for a specific date (all periods)
app.post('/api/sleep-data', (req, res) => {
    const { date, sleepData: newSleepData } = req.body;
    
    if (!date || !newSleepData) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sleepData = readData(SLEEP_FILE);
    sleepData[date] = newSleepData;
    
    if (writeData(SLEEP_FILE, sleepData)) {
        res.json({ success: true, message: 'Sleep data saved successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save sleep data' });
    }
});

// Get sleep leaderboard (students ranked by total sleep count)
app.get('/api/sleep-leaderboard', (req, res) => {
    const sleepData = readData(SLEEP_FILE);
    
    // Count total sleeps for each student across all dates and periods
    const sleepCounts = {};
    
    Object.values(sleepData).forEach(dayData => {
        Object.entries(dayData).forEach(([key, status]) => {
            if (status === 'sleeping') {
                // Key format could be "StudentName-Period" (new format) or just "StudentName" (old format)
                const studentName = key.includes('-') ? key.substring(0, key.lastIndexOf('-')) : key;
                if (studentName && studentName.trim()) {
                    sleepCounts[studentName] = (sleepCounts[studentName] || 0) + 1;
                }
            }
        });
    });
    
    // Convert to array and sort by sleep count (descending)
    const leaderboard = Object.entries(sleepCounts).map(([name, sleepCount]) => ({
        name,
        sleepCount
    }));
    
    leaderboard.sort((a, b) => b.sleepCount - a.sleepCount);
    
    res.json(leaderboard);
});

// =================== DON'T TALK COUNTER ENDPOINTS ===================

// Get don't talk counter
app.get('/api/counter', (req, res) => {
    try {
        const counterData = readData(COUNTER_FILE);
        const today = new Date().toDateString();
        
        // Reset counter if it's a new day
        if (counterData.date !== today) {
            const resetData = { count: 0, date: today };
            writeData(COUNTER_FILE, resetData);
            res.json(resetData);
        } else {
            res.json(counterData);
        }
    } catch (error) {
        console.error('Error reading counter:', error);
        res.status(500).json({ error: 'Failed to read counter' });
    }
});

// Increment don't talk counter
app.post('/api/counter/increment', (req, res) => {
    try {
        const counterData = readData(COUNTER_FILE);
        const today = new Date().toDateString();
        
        let newCount;
        if (counterData.date !== today) {
            // New day, start from 1
            newCount = 1;
        } else {
            // Same day, increment
            newCount = (counterData.count || 0) + 1;
        }
        
        const updatedData = { count: newCount, date: today };
        writeData(COUNTER_FILE, updatedData);
        
        res.json(updatedData);
    } catch (error) {
        console.error('Error incrementing counter:', error);
        res.status(500).json({ error: 'Failed to increment counter' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize data files
initializeDataFiles();

// Start server
app.listen(PORT, () => {
    console.log(`Quiz Guess server running on port ${PORT}`);
    console.log(`Access the website at: http://localhost:${PORT}`);
}); 