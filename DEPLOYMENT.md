# Quiz Guess - Deployment Guide

## 🚀 Hosting Options

### Option 1: Heroku (Recommended)
1. **Create Heroku account** at https://heroku.com
2. **Install Heroku CLI** from https://devcenter.heroku.com/articles/heroku-cli
3. **Deploy to Heroku:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-quiz-app-name
   git push heroku main
   ```

### Option 2: Railway
1. **Visit** https://railway.app
2. **Connect your GitHub repository**
3. **Deploy automatically** - Railway will detect Node.js and deploy

### Option 3: Netlify + Serverless Functions
1. **Upload to GitHub**
2. **Connect to Netlify**
3. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `public`

### Option 4: DigitalOcean App Platform
1. **Create DigitalOcean account**
2. **Create new app from GitHub**
3. **Configure:**
   - Source: Your GitHub repository
   - Build command: `npm install`
   - Run command: `npm start`

### Option 5: AWS Elastic Beanstalk
1. **Install AWS CLI**
2. **Create application:**
   ```bash
   zip -r quiz-guess.zip . -x "node_modules/*" "data/*"
   ```
3. **Upload to Elastic Beanstalk**

## 📁 File Structure for Deployment
```
quiz-guess/
├── server.js          # Backend server
├── package.json       # Dependencies
├── public/            # Frontend files
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── data/              # Database files (auto-created)
│   ├── votes.json
│   ├── scores.json
│   └── results.json
└── README.md
```

## 🔧 Environment Variables
Set these on your hosting platform:
- `PORT`: Server port (usually auto-set by hosting platform)
- `NODE_ENV`: Set to `production` for production deployment

## 📊 Database
- Uses JSON files for simplicity
- Data persists between server restarts
- Files are created automatically in `data/` directory

## 🌐 Domain Setup
After deployment, you'll get a URL like:
- Heroku: `https://your-app-name.herokuapp.com`
- Railway: `https://your-app-name.railway.app`
- Netlify: `https://your-app-name.netlify.app`

## 🔒 Security Considerations
- Add rate limiting for API endpoints
- Implement proper authentication for admin functions
- Use HTTPS (most platforms provide this automatically)
- Consider using environment variables for sensitive data

## 📈 Scaling
For high traffic, consider:
- Using a proper database (PostgreSQL, MongoDB)
- Implementing caching (Redis)
- Using a CDN for static files
- Adding load balancing

## 🐛 Troubleshooting
- Check server logs for errors
- Ensure all dependencies are in `package.json`
- Verify file permissions for data directory
- Test API endpoints manually

## 📱 Mobile Optimization
- Responsive design already implemented
- Works on all mobile devices
- PWA features can be added for app-like experience 