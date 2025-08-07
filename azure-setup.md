# Azure Migration Guide for Quiz Guess

## Overview
This guide will help you migrate your Quiz Guess application from Railway to Azure with persistent data storage.

## Prerequisites
- Azure account (free tier available)
- Azure CLI installed
- GitHub account (for CI/CD)

## Step 1: Azure Setup

### 1.1 Create Azure Resources
```bash
# Login to Azure
az login

# Create resource group
az group create --name quizguess-rg --location eastus

# Create App Service Plan (Free tier)
az appservice plan create --name quizguess-plan --resource-group quizguess-rg --sku F1 --is-linux

# Create Web App
az webapp create --name quizguess-app --resource-group quizguess-rg --plan quizguess-plan --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set --name quizguess-app --resource-group quizguess-rg --settings NODE_ENV=production
```

### 1.2 Set up Database (Choose one option)

#### Option A: Azure Database for PostgreSQL (Recommended)
```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name quizguess-db \
  --resource-group quizguess-rg \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group quizguess-rg \
  --server-name quizguess-db \
  --database-name quizguess_data

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name quizguess-db \
  --admin-user dbadmin \
  --admin-password "YourSecurePassword123!" \
  --database-name quizguess_data
```

#### Option B: Azure Cosmos DB (NoSQL)
```bash
# Create Cosmos DB account
az cosmosdb create --name quizguess-cosmos --resource-group quizguess-rg

# Create database
az cosmosdb sql database create \
  --account-name quizguess-cosmos \
  --resource-group quizguess-rg \
  --name quizguess_data

# Create container
az cosmosdb sql container create \
  --account-name quizguess-cosmos \
  --resource-group quizguess-rg \
  --database-name quizguess_data \
  --name votes \
  --partition-key-path "/date"
```

## Step 2: Update Application for Azure

### 2.1 Install Database Dependencies
```bash
# For PostgreSQL
npm install pg

# For Cosmos DB
npm install @azure/cosmos
```

### 2.2 Update server.js for Database
The application needs to be modified to use a database instead of file storage. See `server-azure.js` for the updated version.

### 2.3 Configure Environment Variables
Set these in Azure App Service Configuration:
- `DATABASE_URL` (PostgreSQL connection string)
- `NODE_ENV=production`
- `PORT=8080`

## Step 3: Deploy to Azure

### 3.1 Using Azure CLI
```bash
# Deploy from local directory
az webapp deployment source config-local-git --name quizguess-app --resource-group quizguess-rg

# Get deployment URL
az webapp deployment list-publishing-credentials --name quizguess-app --resource-group quizguess-rg

# Deploy
git remote add azure <deployment-url>
git push azure main
```

### 3.2 Using GitHub Actions (Recommended)
1. Fork this repository to your GitHub account
2. In Azure Portal, go to your App Service → Deployment Center
3. Choose GitHub as source
4. Authorize and select your repository
5. The GitHub Action will automatically deploy on push

## Step 4: Data Migration (If Needed)

Since your Railway data was empty, you can start fresh. If you had data, here's how to migrate:

### 4.1 Export from Railway (if data exists)
```bash
# Use the extraction scripts we created
node extract-via-api.js
```

### 4.2 Import to Azure Database
Create a migration script to import the JSON data into your chosen database.

## Step 5: Verify Deployment

1. Visit your Azure App Service URL: `https://quizguess-app.azurewebsites.net`
2. Test all features:
   - User sign-in
   - Voting functionality
   - Leaderboard
   - Admin panel
   - Sleep tracking

## Step 6: Clean Up Railway

After successful Azure deployment:
1. Delete your Railway project
2. Remove Railway CLI: `npm uninstall -g @railway/cli`

## Cost Estimation (Monthly)

### Free Tier (Recommended for starting)
- **Azure App Service**: Free (F1 tier)
- **Azure Database for PostgreSQL**: ~$25/month (Basic tier)
- **Total**: ~$25/month

### Production Tier
- **Azure App Service**: ~$13/month (B1 tier)
- **Azure Database for PostgreSQL**: ~$25/month (Basic tier)
- **Total**: ~$38/month

## Benefits of Azure Migration

✅ **Persistent Storage**: Data survives deployments and restarts  
✅ **Scalability**: Easy to scale up as your app grows  
✅ **Reliability**: 99.9% uptime SLA  
✅ **Security**: Built-in security features  
✅ **Monitoring**: Azure Application Insights  
✅ **Backup**: Automated database backups  

## Support

If you encounter issues:
1. Check Azure App Service logs
2. Review GitHub Actions deployment logs
3. Use Azure Application Insights for monitoring
4. Check Azure status page for service issues 