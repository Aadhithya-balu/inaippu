# Inaippu — Unified Digital Governance Platform

> **"Inaippu"** (இணைப்பு) means *"Connection"* in Tamil — bridging citizens with government services seamlessly.

---

## Abstract

Inaippu is a full-stack e-Governance web platform that digitizes the interaction between Indian citizens and government departments. It provides a single unified portal for submitting service requests, filing structured grievances, uploading supporting documents, and tracking real-time status — eliminating the need for physical visits and manual paperwork.

The platform is inspired by real-world Indian e-Governance systems like UMANG, e-District, and CPGRAMS, and is built to replicate production-grade workflows including Aadhaar-based authentication, department-wise officer routing, workload balancing, SLA tracking, and an AI-powered citizen assistant.

---

## Problem Statement

Citizens in India face significant friction when accessing government services:
- Multiple disconnected portals for different services
- No real-time visibility into request status
- Manual, paper-based grievance filing with no tracking
- Lack of accountability in officer assignment and resolution
- No intelligent guidance for citizens unfamiliar with procedures

Inaippu solves all of the above in a single, role-aware, AI-assisted platform.

---

## Objectives

- Provide a **single portal** for all citizen-government interactions
- Enable **Aadhaar-based secure login** with role-based access control
- Allow citizens to **submit service requests and grievances** with dynamic, department-specific forms
- Route requests **automatically** to the correct officer based on department, city, and workload
- Give citizens **real-time status tracking** with resolution notes
- Empower officers with a **structured workflow dashboard** to manage assigned tasks
- Give admins **analytics and control** over the entire system
- Integrate a **Gemini AI chatbot** for citizen guidance and FAQ resolution
- Support **document uploads** (PDF, images) via Supabase Storage

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js v5 | REST API server |
| Supabase (PostgreSQL) | Primary database |
| `@supabase/supabase-js` | Supabase client SDK |
| JSON Web Tokens (JWT) | Stateless authentication |
| bcryptjs | Password hashing |
| Google Gemini API (`@google/generative-ai`) | AI chatbot backend |
| dotenv | Environment configuration |
| cors | Cross-origin request handling |
| nodemon | Dev server auto-reload |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite 8 | UI framework and build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling |
| Axios | HTTP client for API calls |
| lucide-react | Icon library |
| Context API | Language/global state management |

### Infrastructure
| Service | Purpose |
|---|---|
| Supabase | PostgreSQL DB + File Storage |
| Google Gemini | Generative AI for chatbot |

---

## Directory Structure

```
Inaippu/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client initialization
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js              # Register / Login endpoints
│   │   ├── requests.js          # Service & grievance request CRUD
│   │   ├── complaints.js        # Structured complaint submission & routing
│   │   ├── documents.js         # Document upload to Supabase Storage
│   │   ├── admin.js             # Admin analytics & user management
│   │   ├── ai.js                # Gemini AI chat endpoint
│   │   └── location.js          # States / Cities / Zones lookup
│   ├── schema.sql               # Full DB schema + seed data
│   ├── server.js                # Express app entry point
│   ├── package.json
│   └── .env                     # Environment variables (not committed)
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── image.png
│   │   ├── components/
│   │   │   ├── AIChat.jsx           # Floating Gemini AI chat widget
│   │   │   ├── DocumentUploader.jsx # File upload component
│   │   │   ├── FieldError.jsx       # Form validation error display
│   │   │   ├── LocationPicker.jsx   # State → City → Zone cascading picker
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   ├── ProtectedRoute.jsx   # Role-based route guard
│   │   │   └── Sidebar.jsx          # Dashboard sidebar navigation
│   │   ├── context/
│   │   │   └── LangContext.jsx      # Language/i18n context provider
│   │   ├── hooks/
│   │   │   └── useDraft.js          # Auto-save form draft hook
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── Dashboard.jsx    # Admin analytics & user management
│   │   │   ├── citizen/
│   │   │   │   ├── Dashboard.jsx    # Citizen home with request overview
│   │   │   │   ├── GrievanceForm.jsx # Dynamic grievance submission form
│   │   │   │   ├── RequestList.jsx  # Citizen's submitted requests list
│   │   │   │   └── ServiceForm.jsx  # Service application form
│   │   │   ├── officer/
│   │   │   │   └── Dashboard.jsx    # Officer task queue & status updates
│   │   │   ├── Landing.jsx          # Public landing page
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Citizen registration page
│   │   │   └── Track.jsx            # Public request status tracker
│   │   ├── services/
│   │   │   └── api.js               # Axios instance with auth interceptor
│   │   ├── utils/
│   │   │   └── validate.js          # Form validation utilities
│   │   ├── App.jsx                  # Root component with route definitions
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── implementation_plan.md           # Architecture & design decisions
└── README.md
```

---

## Database Schema

The PostgreSQL database (hosted on Supabase) consists of the following tables:

| Table | Description |
|---|---|
| `users` | All users — citizens, officers, admins. Stores Aadhaar number, role, department, workload count |
| `requests` | General service/grievance requests submitted by citizens |
| `complaints` | Structured complaints with dynamic JSONB form data, routed by department |
| `complaint_types` | Defines complaint categories with dynamic field schemas (JSONB) |
| `documents` | Uploaded files linked to users (stored in Supabase Storage) |
| `departments` | Government departments (Revenue, Health, Urban, PublicWorks) |
| `states` | Indian states (Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana) |
| `cities` | Cities under each state |
| `zones` | Taluks/areas under each city (25 zones per major city) |
| `sla_config` | SLA deadline configuration per complaint type |

### Key DB Features
- Workload balancing via `workload_count` on users + `increment_workload` / `decrement_workload` RPC functions
- Dynamic complaint forms via JSONB `schema` field in `complaint_types`
- Cascading location hierarchy: State → City → Zone
- Seeded with 5 states, 18 cities, 200+ zones, 6 complaint types, 4 departments
- Includes deploy-ready demo users and sample request/complaint data for quick validation

---

## User Roles & Capabilities

### Citizen
- Register with Aadhaar number and personal details
- Login and access a personal dashboard
- Submit **service requests** (e.g., income certificate, caste certificate)
- File **structured grievances** (water supply, electricity, road damage, garbage, transport, etc.)
- Upload supporting documents (PDF, images) to Supabase Storage
- Track real-time status of all submitted requests (`pending → in_progress → resolved/rejected`)
- View resolution notes and officer remarks
- Use the **Gemini AI chatbot** for guidance on services, document requirements, and FAQs
- Select location via cascading State → City → Zone picker

### Officer
- Login to a dedicated officer dashboard
- View all requests **assigned to them** by the system
- Update request status: `pending → in_progress → resolved / rejected`
- Add resolution notes or rejection reasons
- Manage structured complaints routed to their department
- Workload is tracked and balanced automatically across officers

### Admin
- Full visibility into all requests and complaints across all departments
- View platform-wide analytics: total requests, resolution rates, pending counts, department-wise breakdown
- Manage users — view all citizens and officers
- Manually assign or reassign requests to officers
- Access officer performance and workload metrics
- Promote users to officer/admin roles via Supabase UI

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new citizen |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user profile |
| POST | `/api/services` | Citizen | Submit service/grievance request |
| GET | `/api/services` | JWT | Get requests (filtered by role) |
| PUT | `/api/services/:id` | Officer/Admin | Update request status |
| POST | `/api/complaints` | Citizen | Submit structured complaint |
| GET | `/api/complaints` | JWT | Get complaints (filtered by role) |
| PUT | `/api/complaints/:id` | Officer/Admin | Update complaint status |
| GET | `/api/location/states` | Public | List all states |
| GET | `/api/location/cities/:stateId` | Public | Cities by state |
| GET | `/api/location/zones/:cityId` | Public | Zones by city |
| POST | `/api/documents/upload` | Citizen | Upload document to Supabase Storage |
| GET | `/api/documents` | Citizen | Get user's uploaded documents |
| POST | `/api/ai/chat` | Citizen | Send message to Gemini AI |
| GET | `/api/admin/stats` | Admin | Platform analytics |
| GET | `/api/admin/users` | Admin | All users list |

---

## Key Features

- **Aadhaar-based Authentication** — 12-digit Aadhaar number as unique identifier with JWT sessions
- **Dynamic Complaint Forms** — Form fields are driven by JSONB schemas stored in DB, making it easy to add new complaint types without code changes
- **Smart Officer Routing** — Requests are routed to officers based on department match and lowest workload count
- **Cascading Location Picker** — State → City → Zone hierarchy with 200+ seeded zones across South India
- **Document Vault** — Citizens can upload and manage documents linked to their profile
- **Real-time Status Tracking** — Public tracker page allows anyone to check request status by ID
- **Gemini AI Assistant** — Floating chat widget powered by Google Gemini, helps citizens navigate services
- **Role-based Route Guards** — Frontend ProtectedRoute component enforces role-based page access
- **Form Draft Auto-save** — useDraft hook saves form progress to localStorage
- **Input Sanitization** — All user inputs are stripped of HTML tags server-side before DB insertion
- **Workload Balancing** — DB-level RPC functions track and balance officer task loads

---

## Deployment Instructions

### Prerequisites
- Node.js (v18+)
- Supabase account (free tier works)
- Google Gemini API key

### Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the full contents of `backend/schema.sql`
   - This creates all tables, seeds states/cities/zones/departments/complaint types, and creates RPC functions
   - It also seeds demo login data for a citizen, officer, and admin so the app is ready for first-run testing
   - Demo password: `Demo@12345`
   - Demo Aadhaar numbers: `111111111111` (citizen), `222222222222` (officer), `333333333333` (admin)

### Backend Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   npm install
   ```
2. Create `backend/.env`:
   ```env
   PORT=5000
   SUPABASE_URL=YOUR_SUPABASE_URL
   SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   JWT_SECRET=<your_strong_random_secret>
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
3. Start the server:
   ```bash
   node server.js
   # or for dev with auto-reload:
   npx nodemon server.js
   ```

### Frontend Setup
1. Navigate to `/frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

### Testing the Platform
1. Open `http://localhost:5173/`
2. Register a citizen account using any 12-digit Aadhaar number
3. Submit a service request or grievance from the citizen dashboard
4. To test officer/admin dashboards: manually update `users.role` to `'officer'` or `'admin'` in the Supabase Table Editor
5. Login again with that account to access the respective dashboard
6. Use the AI chat widget (bottom-right) on the citizen dashboard

---

## Seeded Data

The schema seeds the following out of the box:

- **5 States**: Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana
- **18 Cities**: Chennai, Coimbatore, Madurai, Salem, Trichy, Tirunelveli, Vellore, Erode, Bengaluru, Mysuru, Mangaluru, Thiruvananthapuram, Kochi, Kozhikode, Visakhapatnam, Vijayawada, Hyderabad, Warangal
- **200+ Zones**: Taluks and localities under each city
- **4 Departments**: Revenue, Health, Urban, PublicWorks
- **6 Complaint Types**: Water Supply Issue, Electricity Problem, Road Damage, Garbage Collection, Public Transport, Other

---

## Inspiration & References

- [UMANG](https://web.umang.gov.in/) — Unified Mobile Application for New-age Governance
- [e-District](https://edistrict.up.gov.in/) — District-level service delivery portal
- [CPGRAMS](https://pgportal.gov.in/) — Centralized Public Grievance Redress and Monitoring System
- India's Digital Public Infrastructure (DPI) paradigms
