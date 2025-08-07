# Azure Deployment Checklist ✅

## Pre-Deployment Setup

### 1. Azure Account & CLI
- [ ] Azure account created (free tier available)
- [ ] Azure CLI installed: `brew install azure-cli` (macOS)
- [ ] Logged in to Azure: `az login`

### 2. Application Files Updated
- [ ] ✅ `server.js` - Updated to use PostgreSQL database
- [ ] ✅ `package.json` - Added `pg` dependency
- [ ] ✅ `public/script.js` - Updated API base URL to be dynamic
- [ ] ✅ `public/styles.css` - Added database status indicator styles
- [ ] ✅ `web.config` - Created for Azure App Service
- [ ] ✅ `azure-deploy.yml` - GitHub Actions workflow
- [ ] ✅ `azure-quick-start.sh` - Automated setup script

## Deployment Steps

### 3. Run Quick Start Script
```bash
# Make script executable
chmod +x azure-quick-start.sh

# Run the automated setup
./azure-quick-start.sh
```

### 4. Manual Setup (if script fails)
```bash
# Create resource group
az group create --name quizguess-rg --location eastus

# Create App Service Plan (Free tier)
az appservice plan create --name quizguess-plan --resource-group quizguess-rg --sku F1 --is-linux

# Create Web App
az webapp create --name quizguess-app --resource-group quizguess-rg --plan quizguess-plan --runtime "NODE|18-lts"

# Create PostgreSQL database
az postgres flexible-server create \
  --name quizguess-db \
  --resource-group quizguess-rg \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "QuizGuess2024!" \
  --sku-name Standard_B1ms \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group quizguess-rg \
  --server-name quizguess-db \
  --database-name quizguess_data
```

### 5. Configure Environment Variables
```bash
# Get connection string
CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name quizguess-db \
  --admin-user dbadmin \
  --admin-password "QuizGuess2024!" \
  --database-name quizguess_data \
  --query connectionString \
  --output tsv)

# Set environment variables
az webapp config appsettings set \
  --name quizguess-app \
  --resource-group quizguess-rg \
  --settings \
  NODE_ENV=production \
  DATABASE_URL="$CONNECTION_STRING"
```

### 6. Deploy Application
```bash
# Configure deployment
az webapp deployment source config-local-git --name quizguess-app --resource-group quizguess-rg

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment list-publishing-credentials \
  --name quizguess-app \
  --resource-group quizguess-rg \
  --query publishingUserName \
  --output tsv)

# Add Azure remote
git remote add azure https://$DEPLOYMENT_URL@quizguess-app.scm.azurewebsites.net/quizguess-app.git

# Deploy
git add .
git commit -m "Deploy to Azure with PostgreSQL database"
git push azure main
```

## Post-Deployment Verification

### 7. Test Application
- [ ] Visit: `https://quizguess-app.azurewebsites.net`
- [ ] Test user sign-in functionality
- [ ] Test voting system
- [ ] Test leaderboard display
- [ ] Test admin panel
- [ ] Test sleep tracking
- [ ] Test "don't talk" counter
- [ ] Verify database status indicator (green dot)

### 8. Database Verification
- [ ] Check Azure Portal → App Service → Logs
- [ ] Verify database tables created successfully
- [ ] Test data persistence across page refreshes

### 9. Performance & Monitoring
- [ ] Set up Azure Application Insights (optional)
- [ ] Monitor application performance
- [ ] Check error logs

## Security & Production

### 10. Security Updates
- [ ] Change default admin password in production
- [ ] Update `DATABASE_URL` with secure password
- [ ] Consider using Azure Key Vault for secrets
- [ ] Enable HTTPS only

### 11. Custom Domain (Optional)
- [ ] Purchase domain name
- [ ] Configure DNS settings
- [ ] Add custom domain to Azure App Service
- [ ] Enable SSL certificate

## Cleanup

### 12. Remove Railway
- [ ] Delete Railway project
- [ ] Uninstall Railway CLI: `npm uninstall -g @railway/cli`
- [ ] Remove Railway files from local project

## Troubleshooting

### Common Issues
1. **Database Connection Error**
   - Check `DATABASE_URL` environment variable
   - Verify PostgreSQL server is running
   - Check firewall rules

2. **Deployment Failed**
   - Check Azure CLI login status
   - Verify resource group exists
   - Check application logs

3. **Application Not Starting**
   - Check `package.json` start script
   - Verify Node.js version compatibility
   - Check environment variables

### Useful Commands
```bash
# Check application logs
az webapp log tail --name quizguess-app --resource-group quizguess-rg

# Restart application
az webapp restart --name quizguess-app --resource-group quizguess-rg

# Check environment variables
az webapp config appsettings list --name quizguess-app --resource-group quizguess-rg
```

## Cost Monitoring

### Monthly Costs (Estimated)
- **Azure App Service (F1)**: Free
- **Azure Database for PostgreSQL (Basic)**: ~$25/month
- **Total**: ~$25/month

### Cost Optimization
- Use F1 tier for App Service (free)
- Consider Basic tier for PostgreSQL
- Monitor usage in Azure Portal
- Set up spending limits

## Success Indicators ✅

- [ ] Application loads without errors
- [ ] All features work correctly
- [ ] Data persists across deployments
- [ ] Database status indicator shows green
- [ ] No Railway dependencies remain
- [ ] Cost is within budget
- [ ] Performance is acceptable

---

**🎉 Congratulations! Your Quiz Guess app is now running on Azure with persistent database storage!** 