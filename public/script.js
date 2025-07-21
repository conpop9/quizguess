// Global variables
let currentUser = null;
let selectedQuizOption = null;
let selectedQuiz = null;
let sleepData = {};

// Student names list
const studentNames = [
    "Aabhas Gangwar", "Aayush Vikramsinh Parmar", "Abdul Razak.A.R", "Abhay Rawat", "Abhishek Jayesh Shah",
    "Akash .", "Akshat Vats", "Ananth .", "Aniruddha Sharma", "Anisha Dev", "Anjali Tanwar", "Ankit Kumar",
    "Anuj Popli", "Anureet Biswas", "Anvesh Raj", "Arnav .", "Arnav Dixit", "Arnav Sahu", "Ayushman Singh",
    "Basavaprabhu Madake", "Benake Shubham Sadashiv", "Bhavesh Gihar", "C Suhana", "Chakaragalla Raju",
    "Dasari Dhiren Dvividar", "Devansh Jajoria", "Dhruv Nagpal", "Disha .", "Diya Mallik", "G R M Shivaanee",
    "Gaikwad Sayali Pandurang", "Gautami Kandhare", "Gurasheesh Singh", "Guruprasath S", "Harmandeep Singh Sahni",
    "Hemant Agarwal", "Jagadish Singh Naik Bhukya", "Jain Sanjoli Dhanraj", "Jeevana Allu", "Jiya Kejriwal",
    "Kale Aayushi Gangadhar", "Karan Chaudhary", "Kavya Akanksha Barwa", "Kethavath Sai Shashank", "Kiran Deepak Ambokar",
    "Komal Haswani", "Konark Sharma", "Kothari Rutva Nimesh", "Krishiv Rahul Agrawal", "Kunal Tandon",
    "Lakhan Mundel", "Latika Jitendrakumar Patel", "Likesh Sinha", "Logavasikkaran M P", "Machiraju Chandana",
    "Makkuva Monica", "Marapally Sai Anuraag", "Matam Satya Prateek", "Mayank Gomekar", "Meghna .",
    "Nitya Chourasiya", "Paras .", "Paurav Vakharia", "Pranav Gupta", "Prathik Nayak", "Raghav Bagri",
    "Rajesh Das", "Rakshika Kosare", "Rigzin Angmo", "Ritesh Naik", "Samridha Varmani", "Sangita Mandal",
    "Sanskar Narayan", "Satyajeet Sahoo", "Shashank .", "Shashish Maurya", "Shruti Jhamb", "Shruti Rajiv Mehta",
    "Shubham Agarwal", "Shubham Shrikant Joshi", "Sparsh Chandra", "Srishti Gupta", "Stevin C C", "Subhajit Maji",
    "Supriya Kabra", "Swathi Raj A B", "Syed Amir Jafri", "Tangirala S S S G Sateesh Chandra", "Umang Saraogi",
    "Utsav Bagri", "Vedansh Kapoor", "Vedant Vikas Chandewar", "Vidhi Shreyans Shah", "Vivek .", "Vrinda Agarwal",
    "Yash Ashok Kumar Patel", "Yash Shukla", "Yerasi Sucharitha"
];

// API base URL
const API_BASE = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showLandingPage();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Add event listener to clear sign-in error when user starts typing
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('input', hideSignInError);
    }
    
    // Add scroll event listener for footer
    window.addEventListener('scroll', handleScroll);
    
    // Refresh data every 10 seconds for real-time updates
    setInterval(function() {
        if (currentUser && !document.getElementById('main-section').classList.contains('hidden')) {
            refreshUserData();
            displayLiveResults();
            displayLeaderboard();
        }
    }, 10000);
});

// Handle scroll events to show/hide footer
function handleScroll() {
    const footer = document.getElementById('footer');
    if (!footer) return;
    
    // Calculate if user has scrolled to bottom
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Show footer when user is near the bottom (within 100px)
    const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
    
    if (isNearBottom) {
        footer.classList.remove('hidden');
        footer.classList.add('show');
    } else {
        footer.classList.remove('show');
        setTimeout(() => {
            if (!footer.classList.contains('show')) {
                footer.classList.add('hidden');
            }
        }, 400); // Wait for transition to complete
    }
}

// Check if user is already signed in
function checkExistingSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainSection();
    }
}

// Show landing page
function showLandingPage() {
    hideAllSections();
    document.getElementById('landing-section').classList.remove('hidden');
}

// Choose app from landing page
function chooseApp(app) {
    if (app === 'quiz') {
        showQuizSignIn();
    } else if (app === 'sleep') {
        showSleepDebtApp();
    }
}

// Go back to home
function goHome() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLandingPage();
}

// Show Quiz Guess sign in
function showQuizSignIn() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainSection();
    } else {
        hideAllSections();
        document.getElementById('quiz-signin-section').classList.remove('hidden');
        
        // Clear the form and any error messages
        document.getElementById('name').value = '';
        hideSignInError();
    }
}

// Show Sleep Debt app
function showSleepDebtApp() {
    hideAllSections();
    document.getElementById('sleep-debt-section').classList.remove('hidden');
    document.getElementById('sleep-navigation').classList.remove('hidden');
    
    // Initialize sleep debt section
    initializeBedDebt();
}

// Hide all sections
function hideAllSections() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('quiz-signin-section').classList.add('hidden');
    document.getElementById('main-section').classList.add('hidden');
    document.getElementById('leaderboard-main-section').classList.add('hidden');
    document.getElementById('sleep-debt-section').classList.add('hidden');
    document.getElementById('admin-login-section').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('quiz-navigation').classList.add('hidden');
    document.getElementById('sleep-navigation').classList.add('hidden');
}

// Sign in function
async function signIn() {
    const name = document.getElementById('name').value.trim();
    const errorDiv = document.getElementById('signin-error');
    
    if (!name) {
        showSignInError('Please enter your name');
        return;
    }
    
    // Check if name exists in student list
    const nameExists = studentNames.some(studentName => 
        studentName.toLowerCase() === name.toLowerCase()
    );
    
    if (!nameExists) {
        showSignInError('real id se aao');
        return;
    }
    
    try {
        // Generate a roll number based on the student's position in the list
        const rollNumber = (studentNames.findIndex(studentName => 
            studentName.toLowerCase() === name.toLowerCase()
        ) + 1).toString();
        
        // Get user data from server
        const response = await fetch(`${API_BASE}/api/user/${rollNumber}`);
        const userData = await response.json();
        
        currentUser = {
            name: name,
            rollNumber: rollNumber,
            score: userData.score
        };
        
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        hideSignInError();
        showMainSection();
    } catch (error) {
        console.error('Error signing in:', error);
        showSignInError('Error signing in. Please try again.');
    }
}

// Show sign-in error message
function showSignInError(message) {
    const errorDiv = document.getElementById('signin-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Hide sign-in error message
function hideSignInError() {
    const errorDiv = document.getElementById('signin-error');
    errorDiv.classList.add('hidden');
}

// Sign out function
function signOut() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showQuizSignIn();
}

// Refresh user data
async function refreshUserData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/user/${currentUser.rollNumber}`);
        const userData = await response.json();
        
        currentUser.score = userData.score;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserInterface();
    } catch (error) {
        console.error('Error refreshing user data:', error);
    }
}

function showMainSection() {
    hideAllSections();
    document.getElementById('main-section').classList.remove('hidden');
    document.getElementById('quiz-navigation').classList.remove('hidden');
    
    // Update navigation buttons
    updateNavButtons('main');
    
    updateUserInterface();
    checkVotingStatus();
    displayLiveResults();
    displayLeaderboard();
}

function showAdminLogin() {
    hideAllSections();
    document.getElementById('admin-login-section').classList.remove('hidden');
    document.getElementById('quiz-navigation').classList.remove('hidden');
    
    // Update navigation buttons
    updateNavButtons('admin');
    
    // Clear password field
    document.getElementById('admin-password').value = '';
}

function showAdmin() {
    hideAllSections();
    document.getElementById('admin-section').classList.remove('hidden');
    document.getElementById('quiz-navigation').classList.remove('hidden');
    
    // Update navigation buttons
    updateNavButtons('admin');
    
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
    hideAllSections();
    document.getElementById('leaderboard-main-section').classList.remove('hidden');
    document.getElementById('quiz-navigation').classList.remove('hidden');
    
    // Update navigation buttons
    updateNavButtons('leaderboard');
    
    displayFullLeaderboard();
}

function showMain() {
    showMainSection();
}

// Update navigation button states
function updateNavButtons(activeSection) {
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to current section
    if (activeSection === 'main') {
        document.getElementById('main-btn').classList.add('active');
    } else if (activeSection === 'leaderboard') {
        document.getElementById('leaderboard-btn').classList.add('active');
    } else if (activeSection === 'admin') {
        document.getElementById('admin-btn').classList.add('active');
    }
}

// Admin login function
function adminLogin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === 'gawd1234') {
        showAdmin();
    } else {
        alert('Incorrect password. Please try again.');
        document.getElementById('admin-password').value = '';
    }
}

// Update user interface
function updateUserInterface() {
    document.getElementById('welcome-text').textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('user-score').textContent = `Score: ${currentUser.score}`;
}

// Check if user can vote
async function checkVotingStatus() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/user/${currentUser.rollNumber}`);
        const userData = await response.json();
        
        if (!userData.votingTimeValid) {
            showTimeRestriction();
        } else if (userData.hasVotedToday) {
            showAlreadyVoted(userData.vote);
        } else {
            showVotingSection();
        }
    } catch (error) {
        console.error('Error checking voting status:', error);
        showTimeRestriction();
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
async function submitVote() {
    if (!selectedQuizOption) {
        alert('Please select whether you think a quiz will happen');
        return;
    }
    
    if (selectedQuizOption === 'yes' && !selectedQuiz) {
        alert('Please select which quiz you think will happen');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rollNumber: currentUser.rollNumber,
                name: currentUser.name,
                quizHappens: selectedQuizOption === 'yes',
                quizSubject: selectedQuiz
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Show success animation instead of alert
            showSuccessAnimation();
            checkVotingStatus();
            displayLiveResults();
            displayLeaderboard();
        } else {
            alert(result.error || 'Failed to submit vote');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('Error submitting vote. Please try again.');
    }
}

// Display live results
async function displayLiveResults() {
    try {
        const response = await fetch(`${API_BASE}/api/results`);
        const results = await response.json();
        
        const resultsContainer = document.getElementById('live-results');
        resultsContainer.innerHTML = '';
        
        if (results.totalVotes === 0) {
            resultsContainer.innerHTML = '<p>No votes yet today</p>';
            return;
        }
        
        // Quiz happens results
        const quizHappensResult = document.createElement('div');
        quizHappensResult.className = 'result-item';
        quizHappensResult.innerHTML = `
            <div>
                <strong>Will quiz happen?</strong>
                <div style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Yes</span>
                        <span>${results.yesVotes} votes (${Math.round((results.yesVotes / results.totalVotes) * 100)}%)</span>
                    </div>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${(results.yesVotes / results.totalVotes) * 100}%"></div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>No</span>
                        <span>${results.noVotes} votes (${Math.round((results.noVotes / results.totalVotes) * 100)}%)</span>
                    </div>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${(results.noVotes / results.totalVotes) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(quizHappensResult);
        
        // Quiz subject results
        const subjectVotes = results.subjectVotes;
        const totalSubjectVotes = Object.values(subjectVotes).reduce((sum, count) => sum + count, 0);
        
        if (totalSubjectVotes > 0) {
            const subjectResult = document.createElement('div');
            subjectResult.className = 'result-item';
            subjectResult.innerHTML = '<div><strong>Quiz Subject Predictions:</strong></div>';
            
            Object.entries(subjectVotes).forEach(([subject, count]) => {
                const percentage = Math.round((count / totalSubjectVotes) * 100);
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
        totalResult.innerHTML = `<div><strong>Total Votes Today: ${results.totalVotes}</strong></div>`;
        resultsContainer.appendChild(totalResult);
        
    } catch (error) {
        console.error('Error displaying live results:', error);
        const resultsContainer = document.getElementById('live-results');
        resultsContainer.innerHTML = '<p>Error loading results</p>';
    }
}

// Display leaderboard in main section
async function displayLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/leaderboard`);
        const leaderboard = await response.json();
        
        const leaderboardContainer = document.getElementById('leaderboard-content');
        leaderboardContainer.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardContainer.innerHTML = '<div class="leaderboard-empty">No scores yet</div>';
            return;
        }
        
        // Show top 5 users
        const topUsers = leaderboard.slice(0, 5);
        
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
    } catch (error) {
        console.error('Error displaying leaderboard:', error);
    }
}

// Display full leaderboard in dedicated section
async function displayFullLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/leaderboard`);
        const leaderboard = await response.json();
        
        const leaderboardContainer = document.getElementById('leaderboard-full-content');
        leaderboardContainer.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardContainer.innerHTML = '<div class="leaderboard-empty">No scores yet</div>';
            return;
        }
        
        // Show all users
        leaderboard.forEach((user, index) => {
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
    } catch (error) {
        console.error('Error displaying full leaderboard:', error);
    }
}

// Admin function to set result
async function setResult() {
    const quizHappened = document.getElementById('admin-quiz-happened').value === 'yes';
    const quizSubject = document.getElementById('admin-quiz-subject').value;
    
    if (document.getElementById('admin-quiz-happened').value === '') {
        alert('Please select whether a quiz happened');
        return;
    }
    
    if (quizHappened && !quizSubject) {
        alert('Please select which quiz happened');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/set-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quizHappened: quizHappened,
                quizSubject: quizSubject || null
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Results processed and scores updated successfully!');
            
            // Refresh user data
            await refreshUserData();
            
            // Clear the form
            document.getElementById('admin-quiz-happened').value = '';
            document.getElementById('admin-quiz-subject').value = '';
            document.getElementById('admin-quiz-selection').classList.add('hidden');
        } else {
            alert(result.error || 'Failed to set result');
        }
    } catch (error) {
        console.error('Error setting result:', error);
        alert('Error setting result. Please try again.');
    }
}

// Success animation functions
function showSuccessAnimation() {
    // Show success message
    showSuccessMessage();
    
    // Create balloons
    createBalloons();
    
    // Create confetti
    createConfetti();
}

function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message success-animate';
    message.textContent = '🎉 Vote Submitted Successfully! 🎉';
    
    document.body.appendChild(message);
    
    // Remove message after 2 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 2000);
}

function createBalloons() {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
    const balloonCount = 15;
    
    for (let i = 0; i < balloonCount; i++) {
        setTimeout(() => {
            const balloon = document.createElement('div');
            balloon.className = `balloon balloon-${colors[Math.floor(Math.random() * colors.length)]} balloon-animate`;
            
            // Random horizontal position
            balloon.style.left = Math.random() * 100 + '%';
            
            // Random animation delay
            balloon.style.animationDelay = Math.random() * 0.5 + 's';
            
            // Random size variation
            const size = 0.8 + Math.random() * 0.4;
            balloon.style.transform = `scale(${size})`;
            
            document.body.appendChild(balloon);
            
            // Remove balloon after animation
            setTimeout(() => {
                if (balloon.parentNode) {
                    balloon.parentNode.removeChild(balloon);
                }
            }, 3500);
        }, i * 100);
    }
}

function createConfetti() {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = `confetti confetti-${colors[Math.floor(Math.random() * colors.length)]} confetti-animate`;
            
            // Random horizontal position
            confetti.style.left = Math.random() * 100 + '%';
            
            // Random animation duration
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            
            // Random animation delay
            confetti.style.animationDelay = Math.random() * 1 + 's';
            
            // Random size
            const size = 5 + Math.random() * 10;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Random shape
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 4000);
        }, i * 50);
    }
}

// =================== BED DEBT TRACKER FUNCTIONS ===================

// Initialize bed debt section
function initializeBedDebt() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sleep-date').value = today;
    
    // Load sleep data for today
    loadSleepData();
}

// Load sleep data for selected date
async function loadSleepData() {
    const selectedDate = document.getElementById('sleep-date').value;
    
    if (!selectedDate) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/sleep-data/${selectedDate}`);
        const data = await response.json();
        
        sleepData = data.sleepData || {};
        createSleepTable();
    } catch (error) {
        console.error('Error loading sleep data:', error);
        sleepData = {};
        createSleepTable();
    }
}

// Auto-save sleep data
async function autoSaveSleepData() {
    const selectedDate = document.getElementById('sleep-date').value;
    
    if (!selectedDate) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/sleep-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: selectedDate,
                sleepData: sleepData
            })
        });
        
        if (!response.ok) {
            console.error('Failed to auto-save sleep data');
        }
    } catch (error) {
        console.error('Error auto-saving sleep data:', error);
    }
}

// Create the Excel-like sleep table
function createSleepTable() {
    const tableBody = document.getElementById('sleep-table-body');
    tableBody.innerHTML = '';
    
    // Get filtered students or all students
    const filteredStudents = getFilteredStudents();
    
    filteredStudents.forEach(name => {
        const row = document.createElement('tr');
        row.dataset.studentName = name;
        
        // Name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell';
        nameCell.textContent = name;
        row.appendChild(nameCell);
        
        // Period cells
        let totalSleep = 0;
        for (let period = 1; period <= 3; period++) {
            const periodCell = document.createElement('td');
            periodCell.className = 'sleep-cell';
            
            const studentKey = `${name}-${period}`;
            const isAsleep = sleepData[studentKey] === 'sleeping';
            
            if (isAsleep) {
                periodCell.classList.add('sleeping');
                periodCell.textContent = '😴';
                totalSleep += 1;
            } else {
                periodCell.classList.add('awake');
                periodCell.textContent = '😊';
            }
            
            periodCell.onclick = () => toggleSleepStatus(periodCell, name, period);
            row.appendChild(periodCell);
        }
        
        // Total cell
        const totalCell = document.createElement('td');
        totalCell.className = 'total-cell';
        totalCell.textContent = totalSleep;
        row.appendChild(totalCell);
        
        tableBody.appendChild(row);
    });
    
}

// Get filtered students based on search filter only
function getFilteredStudents() {
    let filtered = [...studentNames];
    
    // Apply search filter
    const searchTerm = document.getElementById('student-search') ? 
        document.getElementById('student-search').value.toLowerCase().trim() : '';
    
    if (searchTerm) {
        filtered = filtered.filter(name => 
            name.toLowerCase().includes(searchTerm)
        );
    }
    
    return filtered;
}

// Filter students based on search input
function filterStudents() {
    createSleepTable();
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('student-search');
    if (searchInput) {
        searchInput.value = '';
        filterStudents();
    }
}

// Jump to letter function removed - alphabet navigation no longer available

// Toggle sleep status for a student in a specific period
function toggleSleepStatus(cell, studentName, period) {
    const studentKey = `${studentName}-${period}`;
    const currentStatus = sleepData[studentKey] || 'awake';
    const newStatus = currentStatus === 'awake' ? 'sleeping' : 'awake';
    
    // Update data
    sleepData[studentKey] = newStatus;
    
    // Update cell appearance
    cell.classList.remove('awake', 'sleeping');
    cell.classList.add(newStatus);
    cell.textContent = newStatus === 'sleeping' ? '😴' : '😊';
    
    // Update total for this student
    updateStudentTotal(studentName);
    
    // Auto-save data
    autoSaveSleepData();
}

// Update total sleep count for a student
function updateStudentTotal(studentName) {
    let totalSleep = 0;
    for (let period = 1; period <= 3; period++) {
        const studentKey = `${studentName}-${period}`;
        if (sleepData[studentKey] === 'sleeping') {
            totalSleep += 1;
        }
    }
    
    // Find the row and update total cell
    const rows = document.querySelectorAll('#sleep-table-body tr');
    rows.forEach(row => {
        const nameCell = row.querySelector('.name-cell');
        if (nameCell && nameCell.textContent === studentName) {
            const totalCell = row.querySelector('.total-cell');
            if (totalCell) {
                totalCell.textContent = totalSleep;
            }
        }
    });
}

// Show sleep leaderboard modal
function showSleepLeaderboard() {
    displaySleepLeaderboard();
    document.getElementById('sleep-leaderboard-modal').classList.remove('hidden');
}

// Close sleep leaderboard modal
function closeSleepLeaderboard() {
    document.getElementById('sleep-leaderboard-modal').classList.add('hidden');
}

// Display sleep leaderboard
async function displaySleepLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/api/sleep-leaderboard`);
        const leaderboard = await response.json();
        
        const leaderboardContainer = document.getElementById('sleep-leaderboard');
        leaderboardContainer.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardContainer.innerHTML = '<div class="sleep-tracker-empty">No sleep data yet</div>';
            return;
        }
        
        // Show all students with their sleep counts
        leaderboard.forEach((student, index) => {
            const rank = index + 1;
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = `sleep-leaderboard-item ${rank <= 3 ? 'top-sleeper' : ''}`;
            
            let trophy = '';
            if (rank === 1) trophy = '🥇';
            else if (rank === 2) trophy = '🥈'; 
            else if (rank === 3) trophy = '🥉';
            
            leaderboardItem.innerHTML = `
                <div class="sleep-leaderboard-rank">${trophy} ${rank}</div>
                <div class="sleep-leaderboard-name">${student.name}</div>
                <div class="sleep-leaderboard-count">${student.sleepCount}</div>
            `;
            
            leaderboardContainer.appendChild(leaderboardItem);
        });
    } catch (error) {
        console.error('Error displaying sleep leaderboard:', error);
        const leaderboardContainer = document.getElementById('sleep-leaderboard');
        leaderboardContainer.innerHTML = '<div class="sleep-tracker-empty">Error loading leaderboard</div>';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('sleep-leaderboard-modal');
    if (event.target === modal) {
        closeSleepLeaderboard();
    }
}

// Custom success message for sleep tracker
function showSleepSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message success-animate';
    successMsg.textContent = message;
    
    document.body.appendChild(successMsg);
    
    // Remove message after 2 seconds
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.parentNode.removeChild(successMsg);
        }
    }, 2000);
} 