# 💰 Expense Logger PWA

A premium, full-stack Progressive Web Application (PWA) designed to track personal finances. Features dual-mode balance tracking (cash and online accounts), smart expense categories, customizable budget thresholds, auto-recurring bills, and a comprehensive analytics dashboard.

Built using React for a fast, responsive user interface, Express.js on the backend, and Firebase for secure Authentication and Firestore Database management.

---

## ✨ Key Features

- **🔒 Dual Authentication & Access Control**
  - Secure email/password login and registration powered by Firebase Auth.
  - Session security enforced via custom client-to-server JWT Bearer tokens.
  
- **💵 Dual Account Balances**
  - Track separate accounts for **Cash** and **Online** transactions.
  - Real-time balance deductions upon adding, editing, or deleting expenses.
  - Smart alerts (balances turn red when hitting negative values).

- **🏷️ Expense & Budget Management**
  - Log expenses with validation (strict server-side limit of ₹10,000 per transaction).
  - Search by description and filter transactions by category and custom date ranges.
  - Set limits on custom categories with live progress indicators and alerts when spending exceeds 90% of your budget.

- **🗓️ Automated Recurring Expenses**
  - Set daily, weekly, monthly, or yearly recurring expenses (subscriptions, rent, utilities).
  - Client-triggered background application of due recurring expenses.
  - Serverless Vercel Cron integration for automatic daily execution.

- **📊 Data Analytics & Reporting**
  - View spending trends over the last 30 days.
  - Category breakdown and payment method charts powered by `recharts`.
  - Simple daily average spending calculation and next-month projections.
  - Generate and download custom PDF Monthly Spending Reports locally.

- **📱 Progressive Web App (PWA) Support**
  - Add to Home Screen support for mobile devices.
  - Service worker caching for offline asset delivery and smooth performance.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router, Recharts, Axios, html2pdf.js |
| **Backend** | Node.js, Express.js, Firebase Admin SDK |
| **Database** | Google Cloud Firestore |
| **Auth** | Firebase Authentication |
| **Styling** | Custom Responsive CSS (ChatGPT-inspired dark grey palette) |
| **Deployment** | Vercel Serverless Functions |

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ installed on your system.
- A Google Firebase account.

### 1. Clone & Install Dependencies
Navigate to the root directory of the project and install all client and server dependencies:
```bash
npm install
```

### 2. Configure Firebase console
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Go to **Build** → **Authentication** and enable the **Email/Password** sign-in provider.
3. Go to **Build** → **Firestore Database** and create a database in Production Mode.
4. Go to **Project Settings** (gear icon) → **Service Accounts**:
   - Select **Node.js** and click **Generate new private key**.
   - Download the generated JSON file; its values will be required for the backend `.env` file.
5. In **Project Settings** → **General** (scroll to the bottom):
   - Under *Your apps*, click the `</>` (Web app) icon to register an app.
   - Copy the `firebaseConfig` object properties; these values are required for the frontend client `.env`.

### 3. Setup Environment Variables
Copy `.env.example` to `.env` at the root of the project:
```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
# Port Configuration
PORT=5000

# Client-Side Firebase Configuration (Vite prefixed)
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-Side Firebase Admin Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAAASDK...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com

# Cron Job Authorization Secret
CRON_SECRET=your_secure_cron_passphrase
```

> [!IMPORTANT]
> Make sure to wrap the `FIREBASE_PRIVATE_KEY` inside quotes and preserve the `\n` characters so the service account certificate initializes properly.

---

## 💻 Running the App Locally

To launch both the Vite client server and the Express backend server concurrently:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:5000`

---

## 🔒 Firestore Security Rules
Ensure the following security rules are applied in the Firestore Database Console to restrict document access strictly to the authenticated owner:

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

---

## 📡 API Endpoints Reference

All endpoints (except Health Check and Cron jobs) require a Firebase ID token passed in the Authorization header:
`Authorization: Bearer <ID_TOKEN>`

### Auth & Profile
- `GET /api/profile` - Fetch current user profile.
- `POST /api/profile` - Create or update name/email.

### Balances
- `GET /api/balance` - Retrieve cash and online amounts.
- `POST /api/balance` - Manually set initial cash and online balances.

### Expenses
- `GET /api/expenses` - Retrieve user expenses (supports query filters: `search`, `category`, `startDate`, `endDate`).
- `POST /api/expense` - Create a new expense.
- `PUT /api/expense/:id` - Update an existing expense.
- `DELETE /api/expense/:id` - Delete an expense and adjust current balances.

### Budgets & Alerts
- `GET /api/budgets` - Get all budgets.
- `POST /api/budgets` - Create or update spending threshold budgets.
- `DELETE /api/budgets/:id` - Delete a budget.
- `GET /api/stats/budget/check` - Check categories against set limits to output alerts.

### Recurring Expenses
- `GET /api/recurring` - Get list of active recurring subscriptions/charges.
- `POST /api/recurring` - Add a new subscription with frequency logic.
- `DELETE /api/recurring/:id` - Delete a recurring configuration.
- `POST /api/recurring/apply` - Manually check and apply pending bills.

---

## ⏰ Cron Jobs

The application defines serverless crons configured inside `vercel.json` for automated execution:

### 1. Apply Due Recurring Expenses
- **Route**: `GET /api/cron/apply-recurring`
- **Schedule**: Everyday at 12:05 AM UTC (`5 0 * * *`)
- **Required Header**: `Authorization: Bearer <CRON_SECRET>`
- **Logic**: Automatically scans active schedules, creates transactions for due bills, adjusts balances, and recalculates the next due dates.

### 2. Monthly Reset Endpoint
- **Route**: `GET /api/cron/monthly-reset`
- **Schedule**: 1st of every month at 12:00 AM UTC (`0 0 1 * *`)
- **Required Header**: `Authorization: Bearer <CRON_SECRET>`
- **Logic**: Keeps Vercel Cron compatibility but safely carries over user balances instead of wiping them to zero.

---

## 🚢 Deployment on Vercel

The application is fully configured for Vercel using `vercel.json`.

### Deploy using Vercel CLI:
```bash
npm install -g vercel
vercel login
vercel
```

Make sure to configure all environment variables listed in the **Setup** section in the Vercel project dashboard under **Settings** → **Environment Variables**.
