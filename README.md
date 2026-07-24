  # CivicResolve - Smart Citizen Reporting Platform

A full-stack citizen reporting platform built with **React 19** (frontend) and **Python FastAPI** (backend). Citizens can report civic issues with photos and GPS location, while government officials can track, filter, and manage complaints through a real-time dashboard.

---

## Project Structure

```
frontend/                          # React 19 application (CRA + Craco)
  public/
    index.html                     # HTML template
  src/
    index.js                       # Entry point
    index.css                      # Tailwind CSS + shadcn/ui theme variables
    App.js                         # Main app with React Router routes
    App.css                        # Minimal global styles
    lib/
      api.js                       # API client (all backend calls)
      utils.js                     # cn() utility (clsx + tailwind-merge)
    context/
      AuthContext.jsx               # Auth state management provider
    hooks/
      use-toast.js                  # Toast notification hook
    components/
      Layout.jsx                   # Shared navbar + footer layout
      Home.jsx                     # Landing page with features & tech stack
      SignUp.jsx                   # Registration with OTP email verification
      SignIn.jsx                   # Password-based sign in
      Login.jsx                    # OTP-based citizen login
      GovLogin.jsx                 # Government official login
      ReportStart.jsx              # Email check -> routes to signup or signin
      Report.jsx                   # Complaint submission form
      MyComplaints.jsx             # Citizen's submitted complaints list
      Dashboard.jsx                # Gov dashboard with charts, map & filters
      ProtectedRoute.jsx           # Auth route guards (GovRoute / CitizenRoute)
      Demo.jsx                     # Demo/presentation instructions page
      ui/                          # shadcn/ui components (~47 files)
    package.json
    tailwind.config.js
    postcss.config.js
    craco.config.js                # CRA override config
    components.json                # shadcn/ui config
    jsconfig.json

backend/                           # Python FastAPI backend
  server.py                        # API server (auth, complaints, gov endpoints)
  requirements.txt                 # Python dependencies
  data/
    users.json                     # Sample users (file-based storage)
    complaints.json                # Sample complaints for demo

tests/
  __init__.py
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, React Router v7, Tailwind CSS 3, shadcn/ui |
| Charts/Maps | Chart.js, react-chartjs-2, Leaflet, react-leaflet |
| Icons | Lucide React |
| Backend | Python FastAPI, Uvicorn |
| Auth | JWT tokens, OTP via email (SMTP), password hashing |
| Storage | File-based JSON (optional MongoDB via Motor) |
| Forms | react-hook-form, zod, input-otp |

---

## Quick Start

### Prerequisites
- Node.js 18+ and yarn/npm
- Python 3.10+
- (Optional) MongoDB connection string

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The API server runs at **http://localhost:8000**.

> Note: Without `MONGO_URL` set, data is stored in `backend/data/*.json` files.

### 2. Start the Frontend

```bash
cd frontend
yarn install   # or npm install
yarn start     # or npm start
```

The app opens at **http://localhost:3000**.

---

## Authentication Flows

| Flow | Route | Description |
|------|-------|-------------|
| Citizen Sign Up | /signup | Enter name, email, password, phone -> verify OTP |
| Citizen Sign In | /signin | Email + password (supports legacy OTP setup) |
| Citizen Login | /login | Name + email + phone -> OTP to email -> logged in |
| Government Login | /gov-login | Hardcoded demo: `admin` / `admin123` |

---

## Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| / | Home | Public | Landing page with features & tech stack |
| /signup | SignUp | Public | Create citizen account |
| /signin | SignIn | Public | Sign in with email + password |
| /login | Login | Public | OTP-based citizen login |
| /report | ReportStart | Public | Email check -> redirect to signup or signin |
| /report-form | Report | Citizen | Submit a complaint (photo, GPS, priority) |
| /my-complaints | MyComplaints | Citizen | View submitted complaints & status |
| /gov-login | GovLogin | Public | Government official login |
| /dashboard | Dashboard | Gov only | Full dashboard with analytics & management |
| /demo | Demo | Public | Presentation guide |

---

## Key Features

### Citizen Portal
- **Issue Reporting** - Photo upload, GPS location, detailed descriptions
- **Priority Selection** - High / Medium / Low with visual indicators
- **Issue Categories** - Garbage, Potholes, Street lights, Drainage, Water, Traffic, Park, Other
- **Status Tracking** - Track complaints from submission to resolution

### Government Dashboard
- **Complaint Management** - View, filter (status/category/priority), update status
- **Status Workflow** - Pending -> In Progress -> Resolved
- **Analytics Charts** - Category distribution (doughnut), status breakdown (bar)
- **Interactive Map** - Leaflet map showing active complaint locations
- **Search & Filter** - Real-time filtering across all dimensions
- **Photo Evidence** - View complaint photos inline

### Backend API
- Auth: Signup, Signin, OTP send/verify, Gov login, Password setup
- Complaints: Create, list all, list my, update status
- JWT-based authentication with Bearer tokens
- Optional MongoDB support (falls back to file-based JSON)

---

## Configuration

Set these environment variables (or create `backend/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| MONGO_URL | (empty) | MongoDB connection string |
| DB_NAME | civicresolve | MongoDB database name |
| JWT_SECRET | (hardcoded demo) | Secret key for JWT signing |
| SMTP_HOST | smtp.gmail.com | SMTP server for OTP emails |
| SMTP_USER | (empty) | SMTP email address |
| SMTP_PASSWORD | (empty) | SMTP app password |
| CORS_ORIGINS | * | Allowed CORS origins |

---

## Demo Credentials

- **Citizen Account** - Sign up at `/signup` with your email
- **Government Dashboard** - Use `admin` / `admin123` at `/gov-login`

---

**Built for Smart India Hackathon 2025**
*Empowering citizens, enabling transparent governance*