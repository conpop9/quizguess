// Global variables
let currentUser = null;
let userVote = null;
let selectedQuizOption = null;
let selectedQuiz = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'dailyVotes' || e.key === 'userScores') {
            // Show sync indicator
            showSyncIndicator();
            
            // Update displays when data changes in other tabs
            if (currentUser && !document.getElementById('main-section').classList.contains('hidden')) {
                displayLiveResults();
                displayLeaderboard();
                // Update current user's score
                currentUser.score = getUserScore(currentUser.rollNumber);
                updateUserInterface();
            }
        }
    });
    
    // Periodic refresh every 5 seconds to ensure sync
    setInterval(function() {
        if (currentUser && !document.getElementById('main-section').classList.contains('hidden')) {
            displayLiveResults();
            displayLeaderboard();
            // Update current user's score
            currentUser.score = getUserScore(currentUser.rollNumber);
            updateUserInterface();
        }
    }, 5000);
});

// Check if user is already signed in
function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainSection();
    }
}

// Sign in function
function signIn() {
    const name = document.getElementById('name').value.trim();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    
    if (!name || !rollNumber) {
        alert('Please enter both name and roll number');
        return;
    }
    
    // Create or get user
    currentUser = {
        name: name,
        rollNumber: rollNumber,
        score: getUserScore(rollNumber)
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showMainSection();
}

// Sign out function
function signOut() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showSignInSection();
}

// Get user score from localStorage
function getUserScore(rollNumber) {
    const scores = JSON.parse(localStorage.getItem('userScores')) || {};
    return scores[rollNumber] || 0;
}

// Update user score
function updateUserScore(rollNumber, newScore) {
    const scores = JSON.parse(localStorage.getItem('userScores')) || {};
    scores[rollNumber] = newScore;
    localStorage.setItem('userScores', JSON.stringify(scores));
}

// Show different sections
function showSignInSection() {
    document.getElementById('signin-section').classList.remove('hidden');
    document.getElementById('main-section').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('navigation').classList.add('hidden');
}

function showMainSection() {
    document.getElementById('signin-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('navigation').classList.remove('hidden');
    
    updateUserInterface();
    checkVotingStatus();
    displayLiveResults();
    displayLeaderboard();
}

function showAdmin() {
    document.getElementById('signin-section').classList.add('hidden');
    document.getElementById('main-section').classList.add('hidden');
    document.getElementById('leaderboard-main-section').classList.add('hidden');
    document.getElementById('admin-section').classList.remove('hidden');
    document.getElementById('navigation').classList.remove('hidden');
    
    // Show quiz selection if quiz happened is selected
    document.getElementById('admin-quiz-happened').addEventListener('change', function() {
        const quizSelection = document.getElementById('admin-quiz-selection');
        if (this.value === 'yes') {
            quizSelection.classList.remove('hidden');
        } else {
            quizSelection.classList.add('hidden');
        }
    });
}

function showLeaderboard() {
    document.getElementById('signin-section').classList.add('hidden');
    document.getElementById('main-section').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('leaderboard-main-section').classList.remove('hidden');
    document.getElementById('navigation').classList.remove('hidden');
    
    displayFullLeaderboard();
}

function showMain() {
    showMainSection();
}

// Display leaderboard in main section
function displayLeaderboard() {
    const userScores = JSON.parse(localStorage.getItem('userScores')) || {};
    const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
    
    const leaderboardContainer = document.getElementById('leaderboard-content');
    leaderboardContainer.innerHTML = '';
    
    // Create array of users with their scores and names
    const users = Object.entries(userScores).map(([rollNumber, score]) => {
        const userVote = userVotes[rollNumber];
        const name = userVote ? userVote.name : `User ${rollNumber}`;
        return { rollNumber, name, score };
    });
    
    // Sort by score (descending)
    users.sort((a, b) => b.score - a.score);
    
    if (users.length === 0) {
        leaderboardContainer.innerHTML = '<div class="leaderboard-empty">No scores yet</div>';
        return;
    }
    
    // Show top 5 users
    const topUsers = users.slice(0, 5);
    
    topUsers.forEach((user, index) => {
        const rank = index + 1;
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = `leaderboard-item ${rank <= 3 ? 'top-3' : ''}`;
        
        leaderboardItem.innerHTML = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-name">
                ${user.name}
                <span class="leaderboard-roll">(${user.rollNumber})</span>
            </div>
            <div class="leaderboard-score">${user.score}</div>
        `;
        
        leaderboardContainer.appendChild(leaderboardItem);
    });
}

// Display full leaderboard in dedicated section
function displayFullLeaderboard() {
    const userScores = JSON.parse(localStorage.getItem('userScores')) || {};
    const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
    
    const leaderboardContainer = document.getElementById('leaderboard-full-content');
    leaderboardContainer.innerHTML = '';
    
    // Create array of users with their scores and names
    const users = Object.entries(userScores).map(([rollNumber, score]) => {
        const userVote = userVotes[rollNumber];
        const name = userVote ? userVote.name : `User ${rollNumber}`;
        return { rollNumber, name, score };
    });
    
    // Sort by score (descending)
    users.sort((a, b) => b.score - a.score);
    
    if (users.length === 0) {
        leaderboardContainer.innerHTML = '<div class="leaderboard-empty">No scores yet</div>';
        return;
    }
    
    // Show all users
    users.forEach((user, index) => {
        const rank = index + 1;
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = `leaderboard-item ${rank <= 3 ? 'top-3' : ''}`;
        
        leaderboardItem.innerHTML = `
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-name">
                ${user.name}
                <span class="leaderboard-roll">(${user.rollNumber})</span>
            </div>
            <div class="leaderboard-score">${user.score}</div>
        `;
        
        leaderboardContainer.appendChild(leaderboardItem);
    });
}

// Update user interface
function updateUserInterface() {
    document.getElementById('welcome-text').textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('user-score').textContent = `Score: ${currentUser.score}`;
}

// Check if user can vote (time restriction and daily limit)
function checkVotingStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check time restriction (12:00 AM to 8:30 PM = 0:00 to )
    const isWithinTimeLimit = (currentHour < 23) || (currentHour === 23 && currentMinute <= 30);
    
    // Check if user has already voted today
    const today = new Date().toDateString();
    const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
    const userVotedToday = userVotes[currentUser.rollNumber] && userVotes[currentUser.rollNumber].date === today;
    
    if (!isWithinTimeLimit) {
        showTimeRestriction();
    } else if (userVotedToday) {
        showAlreadyVoted(userVotes[currentUser.rollNumber]);
    } else {
        showVotingSection();
    }
}

function showTimeRestriction() {
    document.getElementById('voting-section').classList.add('hidden');
    document.getElementById('already-voted').classList.add('hidden');
    document.getElementById('time-restriction').classList.remove('hidden');
}

function showAlreadyVoted(vote) {
    document.getElementById('voting-section').classList.add('hidden');
    document.getElementById('time-restriction').classList.add('hidden');
    document.getElementById('already-voted').classList.remove('hidden');
    
    let voteText = vote.quizHappens ? 'Yes' : 'No';
    if (vote.quizHappens && vote.quizSubject) {
        voteText += ` - ${vote.quizSubject}`;
    }
    document.getElementById('user-vote').textContent = voteText;
}

function showVotingSection() {
    document.getElementById('voting-section').classList.remove('hidden');
    document.getElementById('already-voted').classList.add('hidden');
    document.getElementById('time-restriction').classList.add('hidden');
}

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Select quiz option (Yes/No)
function selectQuizOption(option) {
    selectedQuizOption = option;
    
    // Update button states
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Show or hide quiz selection
    const quizSelection = document.getElementById('quiz-selection');
    if (option === 'yes') {
        quizSelection.classList.remove('hidden');
    } else {
        quizSelection.classList.add('hidden');
        selectedQuiz = null;
        document.getElementById('submit-section').classList.remove('hidden');
    }
}

// Select quiz subject
function selectQuiz(quiz) {
    selectedQuiz = quiz;
    
    // Update button states
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    document.getElementById('submit-section').classList.remove('hidden');
}

// Submit vote
function submitVote() {
    if (!selectedQuizOption) {
        alert('Please select whether you think a quiz will happen');
        return;
    }
    
    if (selectedQuizOption === 'yes' && !selectedQuiz) {
        alert('Please select which quiz you think will happen');
        return;
    }
    
    // Save vote
    const vote = {
        rollNumber: currentUser.rollNumber,
        name: currentUser.name,
        quizHappens: selectedQuizOption === 'yes',
        quizSubject: selectedQuiz,
        date: new Date().toDateString(),
        timestamp: new Date().toISOString()
    };
    
    // Save to user votes
    const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {};
    userVotes[currentUser.rollNumber] = vote;
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
    
    // Save to daily votes
    const today = new Date().toDateString();
    const dailyVotes = JSON.parse(localStorage.getItem('dailyVotes')) || {};
    if (!dailyVotes[today]) {
        dailyVotes[today] = [];
    }
    dailyVotes[today].push(vote);
    localStorage.setItem('dailyVotes', JSON.stringify(dailyVotes));
    
    // Trigger storage event for other tabs
    broadcastStorageChange('dailyVotes', dailyVotes);
    
    alert('Vote submitted successfully!');
    checkVotingStatus();
    displayLiveResults();
    displayLeaderboard();
}

// Display live results
function displayLiveResults() {
    const today = new Date().toDateString();
    const dailyVotes = JSON.parse(localStorage.getItem('dailyVotes')) || {};
    const todayVotes = dailyVotes[today] || [];
    
    const resultsContainer = document.getElementById('live-results');
    resultsContainer.innerHTML = '';
    
    if (todayVotes.length === 0) {
        resultsContainer.innerHTML = '<p>No votes yet today</p>';
        return;
    }
    
    // Count votes
    const yesVotes = todayVotes.filter(vote => vote.quizHappens).length;
    const noVotes = todayVotes.filter(vote => !vote.quizHappens).length;
    const totalVotes = todayVotes.length;
    
    // Quiz happens results
    const quizHappensResult = document.createElement('div');
    quizHappensResult.className = 'result-item';
    quizHappensResult.innerHTML = `
        <div>
            <strong>Will quiz happen?</strong>
            <div style="margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Yes</span>
                    <span>${yesVotes} votes (${Math.round((yesVotes / totalVotes) * 100)}%)</span>
                </div>
                <div class="result-bar">
                    <div class="result-fill" style="width: ${(yesVotes / totalVotes) * 100}%"></div>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>No</span>
                    <span>${noVotes} votes (${Math.round((noVotes / totalVotes) * 100)}%)</span>
                </div>
                <div class="result-bar">
                    <div class="result-fill" style="width: ${(noVotes / totalVotes) * 100}%"></div>
                </div>
            </div>
        </div>
    `;
    resultsContainer.appendChild(quizHappensResult);
    
    // Quiz subject results
    const quizSubjectVotes = todayVotes.filter(vote => vote.quizHappens && vote.quizSubject);
    if (quizSubjectVotes.length > 0) {
        const subjectCounts = {};
        quizSubjectVotes.forEach(vote => {
            subjectCounts[vote.quizSubject] = (subjectCounts[vote.quizSubject] || 0) + 1;
        });
        
        const subjectResult = document.createElement('div');
        subjectResult.className = 'result-item';
        subjectResult.innerHTML = '<div><strong>Quiz Subject Predictions:</strong></div>';
        
        Object.entries(subjectCounts).forEach(([subject, count]) => {
            const percentage = Math.round((count / quizSubjectVotes.length) * 100);
            const subjectBar = document.createElement('div');
            subjectBar.innerHTML = `
                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>${subject}</span>
                        <span>${count} votes (${percentage}%)</span>
                    </div>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
            subjectResult.appendChild(subjectBar);
        });
        
        resultsContainer.appendChild(subjectResult);
    }
    
    // Total votes
    const totalResult = document.createElement('div');
    totalResult.className = 'result-item';
    totalResult.innerHTML = `<div><strong>Total Votes Today: ${totalVotes}</strong></div>`;
    resultsContainer.appendChild(totalResult);
}

// Admin function to set result
function setResult() {
    const quizHappened = document.getElementById('admin-quiz-happened').value;
    const quizSubject = document.getElementById('admin-quiz-subject').value;
    
    if (!quizHappened) {
        alert('Please select whether a quiz happened');
        return;
    }
    
    if (quizHappened === 'yes' && !quizSubject) {
        alert('Please select which quiz happened');
        return;
    }
    
    const today = new Date().toDateString();
    const dailyVotes = JSON.parse(localStorage.getItem('dailyVotes')) || {};
    const todayVotes = dailyVotes[today] || [];
    
    if (todayVotes.length === 0) {
        alert('No votes to process for today');
        return;
    }
    
    // Calculate scores
    const userScores = JSON.parse(localStorage.getItem('userScores')) || {};
    
    todayVotes.forEach(vote => {
        const currentScore = userScores[vote.rollNumber] || 0;
        let pointsEarned = 0;
        
        if (quizHappened === 'no') {
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
        
        userScores[vote.rollNumber] = currentScore + pointsEarned;
    });
    
    // Save updated scores
    localStorage.setItem('userScores', JSON.stringify(userScores));
    
    // Trigger storage event for other tabs
    broadcastStorageChange('userScores', userScores);
    
    // Save the result
    const results = JSON.parse(localStorage.getItem('dailyResults')) || {};
    results[today] = {
        quizHappened: quizHappened === 'yes',
        quizSubject: quizSubject || null,
        processedAt: new Date().toISOString()
    };
    localStorage.setItem('dailyResults', JSON.stringify(results));
    
    // Update current user score if they're signed in
    if (currentUser) {
        currentUser.score = userScores[currentUser.rollNumber] || 0;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    alert('Results processed and scores updated successfully!');
    
    // Update leaderboard if on main section
    if (!document.getElementById('main-section').classList.contains('hidden')) {
        displayLeaderboard();
    }
    
    // Clear the form
    document.getElementById('admin-quiz-happened').value = '';
    document.getElementById('admin-quiz-subject').value = '';
    document.getElementById('admin-quiz-selection').classList.add('hidden');
}

// Function to broadcast storage changes to other tabs
function broadcastStorageChange(key, value) {
    // Create a custom storage event for cross-tab communication
    const event = new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(value),
        oldValue: localStorage.getItem(key),
        storageArea: localStorage
    });
    
    // Dispatch the event to trigger listeners in other tabs
    window.dispatchEvent(event);
}

// Function to show sync indicator
function showSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
        indicator.style.color = '#ff9900';
        indicator.textContent = '●';
        
        // Reset to green after 1 second
        setTimeout(() => {
            indicator.style.color = '#00ff00';
        }, 1000);
    }
} 