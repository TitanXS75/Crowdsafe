<div align="center">
  <img src="public/logo.png" alt="CrowdSafe Logo" width="120" height="120">

  # CrowdSafe
  ### Smart Crowd Navigation & Safety Platform
  
  [![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.7-orange)](https://firebase.google.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)
</div>

---

## 📋 Overview

**CrowdSafe** is a comprehensive real-time crowd management platform designed for large-scale events. It provides attendees with safe navigation, smart parking assistance, and emergency alerts, while giving organizers powerful tools to monitor crowds, manage zones, and broadcast critical information.

---

## ✨ Features

### 🎫 For Attendees
| Feature | Description |
|---------|-------------|
| **Interactive Event Map** | Real-time map with POIs, boundaries, and navigation |
| **Smart Parking** | Find parking zones, save your vehicle location, get directions back |
| **Live Alerts** | Receive instant notifications from organizers |
| **Emergency SOS** | Quick access to emergency contacts and SOS check-in |
| **Help & FAQs** | Access event information and help desks |

### 🎛️ For Organizers
| Feature | Description |
|---------|-------------|
| **Event Setup** | Create events with custom maps, boundaries, and zones |
| **POI Management** | Add/edit Points of Interest like stages, food courts, first aid |
| **Crowd Control** | Monitor crowd density and restricted zones |
| **Parking Management** | Define parking zones with capacity, view real-time occupancy |
| **Alerts Broadcast** | Send alerts and emergency broadcasts to attendees |
| **SOS Monitoring** | Monitor emergency check-ins and deploy SOS alerts |
| **Analytics & Reports** | View event statistics and generate reports |

### 👨‍💼 For Administrators
| Feature | Description |
|---------|-------------|
| **User Management** | View all attendees and organizers |
| **Event Oversight** | See which organizer created which events |
| **Active Monitoring** | Track active attendee check-ins per event |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **Framer Motion** - Smooth animations
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **React Router** - Client-side routing

### Backend
- **Node.js + Express** - REST API server
- **Firebase Admin SDK** - Server-side Firebase operations
- **Nodemailer** - Email notifications for SOS

### Database & Auth
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Authentication** - User authentication

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Firebase Project** - [Create one](https://console.firebase.google.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/VisionAI_SocialTech_GDGoC_GHRCE.git
cd VisionAI_SocialTech_GDGoC_GHRCE
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

If you encounter dependency conflicts, use:
```bash
npm install --legacy-peer-deps
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication** (Email/Password provider)
4. Enable **Firestore Database**
5. Get your Firebase config from Project Settings

Create `src/lib/firebase.ts` with your config:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 5: Configure Firestore Security Rules

In Firebase Console → Firestore → Rules, add:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /events/{eventId} {
      allow read, write: if request.auth != null;
      match /active_attendees/{attendeeId} {
        allow read, write: if request.auth != null;
      }
    }
    match /alerts/{alertId} {
      allow read, write: if request.auth != null;
    }
    match /parking_zones/{zoneId} {
      allow read, write: if request.auth != null;
    }
    match /parked_vehicles/{docId} {
      allow read, write: if request.auth != null;
    }
    match /emergency_requests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 6: Run the Application

```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5003

---

## 📁 Project Structure

```
VisionAI_SocialTech_GDGoC_GHRCE/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── attendee/        # Attendee-specific components
│   │   ├── organizer/       # Organizer-specific components
│   │   ├── admin/           # Admin-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React context providers (Auth)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and Firebase config
│   │   ├── db.ts            # Firestore database functions
│   │   └── firebase.ts      # Firebase initialization
│   ├── pages/
│   │   ├── attendee/        # Attendee dashboard pages
│   │   ├── organizer/       # Organizer dashboard pages
│   │   ├── admin/           # Admin dashboard pages
│   │   └── auth/            # Authentication pages
│   └── App.tsx              # Main app with routing
├── backend/
│   ├── index.js             # Express server entry
│   ├── routes/              # API routes
│   └── services/            # Business logic services
├── public/                  # Static assets
└── package.json             # Dependencies
```

---

## 📦 Dependencies

### Frontend (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM rendering |
| `react-router-dom` | ^6.30.1 | Client-side routing |
| `firebase` | ^12.7.0 | Firebase SDK |
| `leaflet` | ^1.9.4 | Interactive maps |
| `react-leaflet` | ^4.2.1 | React wrapper for Leaflet |
| `framer-motion` | ^12.24.0 | Animations |
| `recharts` | ^2.15.4 | Charts and graphs |
| `tailwindcss` | ^3.4.17 | CSS framework |
| `lucide-react` | ^0.462.0 | Icons |
| `sonner` | ^1.7.4 | Toast notifications |
| `date-fns` | ^3.6.0 | Date utilities |
| `zod` | ^3.25.76 | Schema validation |

### Backend (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.22.1 | Web server framework |
| `cors` | ^2.8.5 | Cross-origin requests |
| `firebase-admin` | ^13.6.0 | Firebase Admin SDK |
| `nodemailer` | ^7.0.12 | Email sending |
| `dotenv` | ^16.6.1 | Environment variables |

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend in development mode |
| `npm run frontend` | Start only the frontend |
| `npm run backend` | Start only the backend |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 👥 User Roles & Access

| Role | Access Path | Features |
|------|-------------|----------|
| **Attendee** | `/attendee-login` | Event map, parking, alerts, SOS |
| **Organizer** | `/organizer-login` | Event setup, POI, alerts, monitoring |
| **Admin** | `/admin` | User management, system oversight |

---

## 🔐 Test Accounts

For demo purposes:
- **Admin**: `admin@crowdsafe.com` / `asdfghjkl;`
- Create new Organizer/Attendee accounts via signup pages

---

## 📄 License

This project is developed for the **GDGoC GHRCE Hackathon**.

---

## 👨‍💻 Team

**VisionAI - SocialTech Track**

---

<div align="center">
  <strong>Built with ❤️ for safer events</strong>
</div>
