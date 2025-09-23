# 💰 PocketPulse - Personal Finance Dashboard

<div align="center">
  
  ![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
  ![Firebase](https://img.shields.io/badge/Firebase-10.7.1-FFCA28?style=for-the-badge&logo=firebase)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.0-06B6D4?style=for-the-badge&logo=tailwindcss)
  ![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)
  
  **Track your financial health at a glance with AI-powered insights**
  
  [Live Demo](https://your-app.netlify.app)

</div>

## ✨ Features

- 🔐 **Secure Authentication** - Email/Password and Google Sign-in via Firebase
- 💳 **Multi-Account Management** - Track checking, savings, credit cards, and investments
- 📊 **Visual Analytics** - Interactive charts for spending patterns and trends
- 💰 **Transaction Tracking** - Categorized income and expense management
- 📈 **Budget Planning** - Set and monitor monthly spending limits
- 🤖 **AI Financial Advisor** - Personalized insights powered by Google Gemini
- 🌓 **Dark Mode** - Easy on the eyes with theme toggle
- 📱 **Fully Responsive** - Works seamlessly on all devices

## 🖼️ Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Overview)

### Transaction Management
![Transactions](https://via.placeholder.com/800x400?text=Transaction+Management)

### AI Insights
![AI Insights](https://via.placeholder.com/800x400?text=AI+Financial+Insights)

</details>

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account (free)
- Google Gemini API key (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/er-abinesh-21/Pocket-Pulse.git
   cd Pocket-Pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual API keys (see Configuration section below)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuration

### Firebase Setup

1. **Create a Firebase Project**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Note down your configuration

2. **Enable Authentication:**
   - In left sidebar, click "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   
   **For Email/Password:**
   - Enable "Email/Password" (first option)
   - Click "Save"
   
   **For Google Sign-in:**
   - Enable "Google" provider
   - Add support email and save

3. **Enable Firestore Database**
   - Click "Firestore Database" → "Create database"
   - Choose production mode and your region

4. **Get Firebase Configuration**
   - Project Settings → Your apps → Add web app
   - Copy the configuration

### Gemini API Setup

1. **Get your API key from [Google AI Studio](https://aistudio.google.com/)**
2. **Click "Get API key" → "Create API key"**

### Environment Variables

Create a `.env` file in the root directory with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 📱 Usage

### Getting Started
1. **Sign up** with email/password or **Sign in with Google**
2. **Add an account** (Checking, Savings, Credit Card, etc.)
3. **Record transactions** with categories
4. **Set budgets** for different spending categories
5. **Get AI insights** for financial optimization

### Key Features Usage

| Feature | Description |
|---------|------------|
| **Dashboard** | View net worth, monthly income/expenses, savings rate |
| **Transactions** | Add, edit, delete income and expense records |
| **Accounts** | Manage multiple financial accounts |
| **Budgets** | Set and track monthly spending limits |
| **AI Insights** | Get personalized financial advice |

## 🚀 Deployment

### Deploy to Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

   Or drag and drop the `dist` folder to [Netlify](https://app.netlify.com/)

3. **Add environment variables in Netlify**
   - Go to Site Settings → Environment Variables
   - Add all variables from your `.env` file

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

## 🛠️ Built With

- **Frontend Framework:** React 18.2 with Vite
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Charts:** Recharts
- **AI Integration:** Google Gemini API
- **Icons:** Lucide React
- **Deployment:** Netlify/Vercel

## 📂 Project Structure

```
PocketPulse/
├── src/
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles and Tailwind
├── public/
│   └── _redirects      # Netlify routing configuration
├── .env.example        # Environment variables template
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── netlify.toml        # Netlify deployment config
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Abinesh**
- GitHub: [@er-abinesh-21](https://github.com/er-abinesh-21)
- Project Link: [Github.com/Pocket-Pulse](https://github.com/er-abinesh-21/Pocket-Pulse)

## 🙏 Acknowledgments

- Firebase for backend services
- Google Gemini for AI capabilities
- React and Vite communities
- Tailwind CSS for styling framework

---

<div align="center">
  Made with ❤️ by Abinesh
  
  ⭐ Star this repo if you find it helpful!
</div>
