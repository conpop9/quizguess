const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create votes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                date VARCHAR(50) NOT NULL,
                roll_number VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                quiz_happens BOOLEAN NOT NULL,
                quiz_subject VARCHAR(20),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date, roll_number)
            )
        `);

        // Create scores table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                roll_number VARCHAR(50) PRIMARY KEY,
                score INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create results table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                date VARCHAR(50) UNIQUE NOT NULL,
                quiz_happened BOOLEAN NOT NULL,
                quiz_subject VARCHAR(20),
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create sleep data table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sleep_data (
                id SERIAL PRIMARY KEY,
                date VARCHAR(50) NOT NULL,
                student_name VARCHAR(100) NOT NULL,
                period VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL,
                UNIQUE(date, student_name, period)
            )
        `);

        // Create counter table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS counter (
                id INTEGER PRIMARY KEY DEFAULT 1,
                count INTEGER DEFAULT 0,
                date VARCHAR(50) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Initialize counter if empty
        const counterResult = await pool.query('SELECT COUNT(*) FROM counter');
        if (parseInt(counterResult.rows[0].count) === 0) {
            await pool.query('INSERT INTO counter (count, date) VALUES (0, $1)', [new Date().toDateString()]);
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
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
app.get('/api/user/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const today = getCurrentDate();
        
        // Get user score
        const scoreResult = await pool.query(
            'SELECT score FROM scores WHERE roll_number = $1',
            [rollNumber]
        );
        const userScore = scoreResult.rows[0]?.score || 0;
        
        // Check if user voted today
        const voteResult = await pool.query(
            'SELECT * FROM votes WHERE date = $1 AND roll_number = $2',
            [today, rollNumber]
        );
        const userVotedToday = voteResult.rows[0] || null;
        
        res.json({
            score: userScore,
            hasVotedToday: !!userVotedToday,
            vote: userVotedToday,
            votingTimeValid: isVotingTimeValid()
        });
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Submit vote
app.post('/api/vote', async (req, res) => {
    try {
        const { rollNumber, name, quizHappens, quizSubject } = req.body;
        
        if (!rollNumber || !name || quizHappens === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!isVotingTimeValid()) {
            return res.status(400).json({ error: 'Voting is not allowed at this time' });
        }
        
        const today = getCurrentDate();
        
        // Check if user already voted today
        const existingVote = await pool.query(
            'SELECT * FROM votes WHERE date = $1 AND roll_number = $2',
            [today, rollNumber]
        );
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ error: 'You have already voted today' });
        }
        
        // Add new vote
        await pool.query(
            'INSERT INTO votes (date, roll_number, name, quiz_happens, quiz_subject) VALUES ($1, $2, $3, $4, $5)',
            [today, rollNumber, name, quizHappens, quizSubject]
        );
        
        res.json({ success: true, message: 'Vote submitted successfully' });
    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ error: 'Failed to save vote' });
    }
});

// Get live results
app.get('/api/results', async (req, res) => {
    try {
        const today = getCurrentDate();
        
        const votesResult = await pool.query(
            'SELECT * FROM votes WHERE date = $1',
            [today]
        );
        
        const todayVotes = votesResult.rows;
        
        if (todayVotes.length === 0) {
            return res.json({
                totalVotes: 0,
                yesVotes: 0,
                noVotes: 0,
                subjectVotes: {}
            });
        }
        
        const yesVotes = todayVotes.filter(vote => vote.quiz_happens).length;
        const noVotes = todayVotes.filter(vote => !vote.quiz_happens).length;
        
        const subjectVotes = {};
        todayVotes.forEach(vote => {
            if (vote.quiz_happens && vote.quiz_subject) {
                subjectVotes[vote.quiz_subject] = (subjectVotes[vote.quiz_subject] || 0) + 1;
            }
        });
        
        res.json({
            totalVotes: todayVotes.length,
            yesVotes,
            noVotes,
            subjectVotes
        });
    } catch (error) {
        console.error('Error getting results:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const scoresResult = await pool.query(
            'SELECT s.roll_number, s.score, v.name FROM scores s LEFT JOIN votes v ON s.roll_number = v.roll_number ORDER BY s.score DESC'
        );
        
        const leaderboard = scoresResult.rows.map(row => ({
            rollNumber: row.roll_number,
            name: row.name || `User ${row.roll_number}`,
            score: row.score
        }));
        
        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Set results and calculate scores
app.post('/api/admin/set-result', async (req, res) => {
    try {
        const { quizHappened, quizSubject } = req.body;
        
        if (quizHappened === undefined) {
            return res.status(400).json({ error: 'quizHappened is required' });
        }
        
        if (quizHappened && !quizSubject) {
            return res.status(400).json({ error: 'quizSubject is required when quiz happened' });
        }
        
        const today = getCurrentDate();
        
        // Get today's votes
        const votesResult = await pool.query(
            'SELECT * FROM votes WHERE date = $1',
            [today]
        );
        
        const todayVotes = votesResult.rows;
        
        if (todayVotes.length === 0) {
            return res.status(400).json({ error: 'No votes to process for today' });
        }
        
        // Calculate and update scores
        for (const vote of todayVotes) {
            let pointsEarned = 0;
            
            if (!quizHappened) {
                if (!vote.quiz_happens) {
                    pointsEarned = 1;
                }
            } else {
                if (vote.quiz_happens) {
                    pointsEarned = 1;
                    if (vote.quiz_subject === quizSubject) {
                        pointsEarned = 2;
                    }
                }
            }
            
            // Update or insert score
            await pool.query(
                `INSERT INTO scores (roll_number, score) VALUES ($1, $2)
                 ON CONFLICT (roll_number) DO UPDATE SET score = scores.score + $2`,
                [vote.roll_number, pointsEarned]
            );
        }
        
        // Save result
        await pool.query(
            'INSERT INTO results (date, quiz_happened, quiz_subject) VALUES ($1, $2, $3) ON CONFLICT (date) DO UPDATE SET quiz_happened = $2, quiz_subject = $3',
            [today, quizHappened, quizSubject]
        );
        
        res.json({ success: true, message: 'Results processed and scores updated successfully' });
    } catch (error) {
        console.error('Error setting results:', error);
        res.status(500).json({ error: 'Failed to save results' });
    }
});

// Sleep tracker routes
app.get('/api/sleep-data/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        const sleepResult = await pool.query(
            'SELECT student_name, period, status FROM sleep_data WHERE date = $1',
            [date]
        );
        
        const sleepData = {};
        sleepResult.rows.forEach(row => {
            const key = `${row.student_name}-${row.period}`;
            sleepData[key] = row.status;
        });
        
        res.json({ sleepData });
    } catch (error) {
        console.error('Error getting sleep data:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/sleep-data', async (req, res) => {
    try {
        const { date, sleepData: newSleepData } = req.body;
        
        if (!date || !newSleepData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Clear existing data for this date
        await pool.query('DELETE FROM sleep_data WHERE date = $1', [date]);
        
        // Insert new data
        for (const [key, status] of Object.entries(newSleepData)) {
            const [studentName, period] = key.split('-');
            await pool.query(
                'INSERT INTO sleep_data (date, student_name, period, status) VALUES ($1, $2, $3, $4)',
                [date, studentName, period, status]
            );
        }
        
        res.json({ success: true, message: 'Sleep data saved successfully' });
    } catch (error) {
        console.error('Error saving sleep data:', error);
        res.status(500).json({ error: 'Failed to save sleep data' });
    }
});

app.get('/api/sleep-leaderboard', async (req, res) => {
    try {
        const sleepResult = await pool.query(
            'SELECT student_name, COUNT(*) as sleep_count FROM sleep_data WHERE status = $1 GROUP BY student_name ORDER BY sleep_count DESC',
            ['sleeping']
        );
        
        const leaderboard = sleepResult.rows.map(row => ({
            name: row.student_name,
            sleepCount: parseInt(row.sleep_count)
        }));
        
        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting sleep leaderboard:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Counter endpoints
app.get('/api/counter', async (req, res) => {
    try {
        const today = new Date().toDateString();
        
        const counterResult = await pool.query('SELECT count, date FROM counter WHERE id = 1');
        const counterData = counterResult.rows[0];
        
        if (counterData.date !== today) {
            // Reset counter for new day
            await pool.query('UPDATE counter SET count = 0, date = $1 WHERE id = 1', [today]);
            res.json({ count: 0, date: today });
        } else {
            res.json(counterData);
        }
    } catch (error) {
        console.error('Error reading counter:', error);
        res.status(500).json({ error: 'Failed to read counter' });
    }
});

app.post('/api/counter/increment', async (req, res) => {
    try {
        const today = new Date().toDateString();
        
        const counterResult = await pool.query('SELECT count, date FROM counter WHERE id = 1');
        const counterData = counterResult.rows[0];
        
        let newCount;
        if (counterData.date !== today) {
            newCount = 1;
        } else {
            newCount = (counterData.count || 0) + 1;
        }
        
        await pool.query('UPDATE counter SET count = $1, date = $2 WHERE id = 1', [newCount, today]);
        
        res.json({ count: newCount, date: today });
    } catch (error) {
        console.error('Error incrementing counter:', error);
        res.status(500).json({ error: 'Failed to increment counter' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Quiz Guess server running on port ${PORT}`);
        console.log(`Access the website at: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
}); 