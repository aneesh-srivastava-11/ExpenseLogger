# 💰 Expense Logger PWA

A modern, full-stack Progressive Web App for tracking personal expenses with Firebase authentication and Firestore database.

## ✨ Features

- **User Authentication** - Email/password login with Firebase Auth
- **Expense Management** - Add, edit, delete expenses with validation (max ₹10,000)
- **Dual Balance Tracking** - Separate cash and online balances (red when negative)
- **Smart Filtering** - Search by description, filter by category and date range
- **Budget Alerts** - Warnings when spending exceeds 90% of set limits
- **Recurring Expenses** - Auto-apply recurring bills (rent, subscriptions)
- **Analytics Dashboard** - Spending trends, category breakdowns, predictions
- **Mobile Responsive** - ChatGPT-inspired grey theme, works on all devices
- **PWA Support** - Install on phone, offline caching via service worker

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase account

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** (production mode)
4. Create a web app in Project Settings
5. Download service account JSON (Settings → Service Accounts → Generate Key)

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

**Required variables:**
- `VITE_FIREBASE_*` - From Firebase web app config
- `FIREBASE_PROJECT_ID` - From service account JSON
- `FIREBASE_PRIVATE_KEY` - From service account JSON (keep quotes and `\n`)
- `FIREBASE_CLIENT_EMAIL` - From service account JSON

### 4. Run Development Server

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📁 Project Structure

```
expenseLogger/
├── server/                 # Express backend
│   ├── config/            # Firebase Admin SDK
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── index.js           # Server entry
├── src/                   # React frontend
│   ├── components/        # Reusable components
│   ├── context/           # Auth & App state
│   ├── pages/             # Route pages
│   ├── styles/            # CSS
│   ├── utils/             # API client, validation
│   └── config/            # Firebase client SDK
└── public/                # Static assets, PWA files
```

## 🎯 Usage

1. **Register** - Create account with name, email, password
2. **Set Balances** - Profile → Set cash and online amounts
3. **Add Expenses** - Dashboard → Quick add or Expenses page
4. **View Analytics** - Analytics → Charts and insights
5. **Manage Budgets** - Profile → Set category budgets
6. **Set Recurring** - Profile → Add monthly bills

## 🔒 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚢 Deployment (Vercel)

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Import in Vercel dashboard
3. Add environment variables
4. Deploy

**Important:** Set ALL `.env` variables in Vercel → Settings → Environment Variables

## 📱 Install as PWA

1. Open deployed app in mobile browser
2. Tap browser menu → "Add to Home Screen"
3. Use as standalone app

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router, Recharts
- **Backend**: Express.js, Firebase Admin SDK
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **Styling**: Custom CSS (ChatGPT-inspired theme)
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: Vercel

## 📊 API Endpoints

All routes require Firebase ID token in `Authorization: Bearer <token>` header:

- `GET /api/profile` - Get user profile
- `POST /api/profile` - Update profile
- `GET /api/balance` - Get balances
- `POST /api/balance` - Set balances
- `POST /api/expense` - Add expense
- `GET /api/expenses` - Get expenses (with filters)
- `PUT /api/expense/:id` - Update expense
- `DELETE /api/expense/:id` - Delete expense
- `GET /api/stats` - Get analytics
- `GET /api/stats/budget/check` - Check budget alerts
- `GET/POST/DELETE /api/budgets` - Manage budgets
- `GET/POST/DELETE /api/recurring` - Manage recurring
- `POST /api/recurring/apply` - Apply pending recurring

## 🎨 Color Palette

```css
--bg-primary: #202123      /* Dark grey background */
--bg-secondary: #343541    /* Card background */
--bg-tertiary: #40414f     /* Input background */
--accent: #10a37f          /* Teal primary color */
--error: #ef4444           /* Red for negative */
--warning: #f59e0b         /* Orange for alerts */
```

## 🐛 Troubleshooting

**Firebase Auth Error**
- Verify API keys in `.env`
- Check authorized domains in Firebase Console

**Firestore Permission Denied**
- Apply security rules above
- Ensure user is authenticated

**Build Fails**
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version` (use 18+)

## 📝 License

MIT

## 👨‍💻 Author

Built with ❤️ using React, Express, and Firebase
