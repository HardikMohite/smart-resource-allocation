# Project Handoff Report: Smart Resource Allocation System

## 🚀 Project Overview
The **Smart Resource Allocation System** is a production-grade platform designed for the **Google Solution Challenge**. It solves the critical problem of data silos and slow response times in disaster relief by using AI to ingest field data and a geospatial engine to dispatch volunteers in real-time.

---

## 🏗️ Technical Architecture
The project follows a decoupled, microservice-style architecture optimized for scalability on Google Cloud.

### 1. Backend (The Core Engine)
- **Framework**: FastAPI (Python)
- **AI Engine**: **Gemini 1.5 Pro** (Multimodal)
- **Primary Logic**: 
    - **AI Ingestion**: Converts messy field images/surveys into structured JSON (Title, Category, Severity, Coordinates).
    - **Matching Algorithm**: Uses the **Haversine formula** (`geopy`) to rank volunteers by proximity and skill match.
- **Deployment**: Ready for **Google Cloud Run** (Dockerfile included).

### 2. Web Admin (NGO Command Center)
- **Framework**: Next.js 14 (App Router) + Tailwind CSS
- **Features**:
    - **Real-time Monitoring**: Live Firestore listeners for tasks and volunteers.
    - **Geospatial Heatmap**: Interactive Google Map with pulsing markers for critical crises.
    - **Dispatch System**: One-click modal to find and assign the best volunteer for any task.

### 3. Mobile App (Volunteer Client)
- **Framework**: Flutter (Material 3)
- **Features**:
    - **Duty Toggle**: Real-time GPS broadcasting to the NGO dashboard.
    - **Task Alerts**: `StreamBuilder` for instant task notifications.
    - **Navigation**: Deep-link integration with Google Maps for field navigation.

### 4. Database & Auth (Firebase)
- **Real-time Sync**: Firestore handles the data flow between all three components.
- **Security**: Strict production rules defined in `firestore.rules`.

---

## 🛠️ Current Status
- [x] **Backend Implemented**: Server is running with Gemini 1.5 Pro integration.
- [x] **Web Dashboard Implemented**: High-end UI with Google Maps and mock data fallbacks.
- [x] **Mobile App Implemented**: Core logic for GPS and task management is ready.
- [x] **API Keys Configured**: Gemini and Google Maps keys are stored in local `.env` files.
- [x] **Codebase Pushed**: Fully version-controlled on [GitHub](https://github.com/neev21-alt/smart-resource-allocation).

---

## 📋 Team Action Items (Next Steps)

### A. Database Connection (Critical)
1. **Firebase Service Account**: Download `serviceAccountKey.json` from the Firebase Console and place it in the `/backend` folder.
2. **Flutter Configuration**: Run `flutterfire configure` in `/mobile_app` to generate the connection files.

### B. Impact Documentation (For Judges)
- **User Testing**: Share the web dashboard with one person and record their feedback.
- **SDG Alignment**: Ensure the final presentation highlights **SDG 11 (Sustainable Cities)** and **SDG 17 (Partnerships)**.

### C. Deployment
- **GCP Cloud Run**: Deploy the backend container to Cloud Run to show the judges a live, scalable API.
- **Firebase Hosting**: Run `firebase deploy` in the web folder for a professional `.web.app` URL.

---

## 💡 Winning Strategy Checklist
- [ ] **Scalability**: Mention that the backend "scales to zero" on Cloud Run.
- [ ] **AI Centrality**: Emphasize that Gemini is the **Data Ingestion Engine**, not just a chatbot.
- [ ] **Visual Wow**: Use the dark-themed dashboard markers to create a "command center" feel during the demo.
