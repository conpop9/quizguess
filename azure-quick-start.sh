#!/bin/bash

echo "🚀 Azure Migration Quick Start for Quiz Guess"
echo "=============================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure first:"
    az login
fi

echo "✅ Azure CLI is ready"

# Create resource group
echo "📦 Creating resource group..."
az group create --name quizguess-rg --location eastus

# Create App Service Plan (Free tier)
echo "📋 Creating App Service Plan..."
az appservice plan create --name quizguess-plan --resource-group quizguess-rg --sku F1 --is-linux

# Create Web App
echo "🌐 Creating Web App..."
az webapp create --name quizguess-app --resource-group quizguess-rg --plan quizguess-plan --runtime "NODE|18-lts"

# Create PostgreSQL database
echo "🗄️  Creating PostgreSQL database..."
az postgres flexible-server create \
  --name quizguess-db \
  --resource-group quizguess-rg \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "QuizGuess2024!" \
  --sku-name Standard_B1ms \
  --version 14

# Create database
echo "📊 Creating database..."
az postgres flexible-server db create \
  --resource-group quizguess-rg \
  --server-name quizguess-db \
  --database-name quizguess_data

# Get connection string
echo "🔗 Getting database connection string..."
CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name quizguess-db \
  --admin-user dbadmin \
  --admin-password "QuizGuess2024!" \
  --database-name quizguess_data \
  --query connectionString \
  --output tsv)

# Configure environment variables
echo "⚙️  Configuring environment variables..."
az webapp config appsettings set \
  --name quizguess-app \
  --resource-group quizguess-rg \
  --settings \
  NODE_ENV=production \
  DATABASE_URL="$CONNECTION_STRING"

# Deploy the application
echo "🚀 Deploying application..."
az webapp deployment source config-local-git --name quizguess-app --resource-group quizguess-rg

# Get deployment URL
DEPLOYMENT_URL=$(az webapp deployment list-publishing-credentials \
  --name quizguess-app \
  --resource-group quizguess-rg \
  --query publishingUserName \
  --output tsv)

echo "✅ Azure resources created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Install PostgreSQL dependency: npm install pg"
echo "2. Rename server-azure.js to server.js"
echo "3. Deploy to Azure:"
echo "   git remote add azure https://$DEPLOYMENT_URL@quizguess-app.scm.azurewebsites.net/quizguess-app.git"
echo "   git push azure main"
echo ""
echo "🌐 Your app will be available at: https://quizguess-app.azurewebsites.net"
echo ""
echo "💡 Don't forget to:"
echo "   - Update the admin password in production"
echo "   - Set up monitoring with Azure Application Insights"
echo "   - Configure custom domain if needed" 