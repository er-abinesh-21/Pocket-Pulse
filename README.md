# 💰 Personal Finance Dashboard - Setup Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js installed on your computer (Download from https://nodejs.org/)
- A Google account (for Firebase and Gemini API)

## 📋 Step-by-Step Setup Instructions

### Step 1: Firebase Setup (5 minutes)

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Click "Create a project"
   - Name it (e.g., "my-finance-dashboard")
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Enable Authentication:**
   - In left sidebar, click "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   
   **For Email/Password:**
   - Enable "Email/Password" (first option)
   - Click "Save"
   
   **For Google Sign-in:**
   - Click on "Google" in the providers list
   - Toggle "Enable" switch
   - Add your project support email
   - Click "Save"

3. **Enable Firestore:**
   - In left sidebar, click "Firestore Database"
   - Click "Create database"
   - Choose "Start in production mode"
   - Select your region
   - Click "Enable"

4. **Get Your Config:**
   - Click gear icon ⚙️ → "Project settings"
   - Scroll to "Your apps"
   - Click "</>" (Web) icon
   - Register app with a name
   - Copy the configuration object

5. **Update App.jsx:**
   - Open `src/App.jsx`
   - Find lines 38-45
   - Replace with your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

### Step 2: Gemini API Setup (2 minutes)

1. **Get API Key:**
   - Go to https://aistudio.google.com/
   - Sign in with Google account
   - Click "Get API key" → "Create API key"
   - Copy the API key

2. **Update App.jsx:**
   - Find line 53
   - Replace with your key:
   ```javascript
   const GEMINI_API_KEY = 'your-actual-gemini-api-key';
   ```

### Step 3: Install & Run (2 minutes)

1. **Open Terminal/Command Prompt in project folder**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - The terminal will show a URL (usually http://localhost:3000)
   - Click it or copy-paste into your browser

## 🎯 Using the App

### First Time Setup:
1. Click "Sign up" to create an account
2. Enter email and password (min 6 characters)
3. You'll be logged in automatically

### Features:
- **Overview Tab:** See your financial summary and charts
- **Transactions Tab:** Add income/expenses
- **Accounts Tab:** Create bank accounts, credit cards, etc.
- **Budgets Tab:** Set monthly spending limits
- **AI Insights Tab:** Get personalized financial advice

### Adding Your First Data:
1. Go to "Accounts" → Click "Add"
2. Create an account (e.g., "My Checking", type: Checking, balance: 1000)
3. Go to "Transactions" → Click "Add"
4. Add a transaction (select the account you created)
5. Watch your dashboard update in real-time!

## 🔧 Troubleshooting

### Common Issues:

**"Firebase not configured" error:**
- Make sure you replaced the Firebase config in App.jsx
- Check that all values are in quotes

**"Cannot connect to Firebase":**
- Check your internet connection
- Verify Firebase project is active
- Make sure Authentication and Firestore are enabled

**"npm install" fails:**
- Make sure Node.js is installed: run `node --version`
- Try deleting `node_modules` folder and run `npm install` again

**App won't start:**
- Make sure you're in the project folder
- Try: `npm install` then `npm run dev`

## 🔒 Security Notes

- Never share your API keys publicly
- Don't commit API keys to GitHub
- For production, use environment variables

## 📱 Features Overview

✅ **User Authentication** - Email/Password and Google Sign-in
✅ **Multiple Accounts** - Track different bank accounts
✅ **Transaction Management** - Income & expense tracking
✅ **Budget Tracking** - Set and monitor spending limits
✅ **Visual Analytics** - Charts and graphs
✅ **AI Insights** - Personalized financial advice
✅ **Dark Mode** - Easy on the eyes
✅ **Fully Responsive** - Works on all devices

## 🆘 Need Help?

1. Check if Firebase and Firestore are enabled
2. Verify API keys are correctly pasted
3. Make sure you're using a modern browser (Chrome, Firefox, Edge)
4. Check the browser console for error messages (F12 → Console tab)

## 🎉 Success Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore enabled
- [ ] Firebase config added to App.jsx
- [ ] Gemini API key added to App.jsx
- [ ] npm install completed
- [ ] npm run dev started
- [ ] App opens in browser
- [ ] Can create an account
- [ ] Can add transactions

Enjoy managing your finances! 💪
