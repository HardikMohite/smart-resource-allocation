# 🌍 Smart Resource Allocation System
**Google Solution Challenge 2026 - Build with AI**

![Hackathon](https://img.shields.io/badge/Hackathon-Solution_Challenge_2026-blue)
![Tech](https://img.shields.io/badge/Tech-Gemini_AI_%7C_Flutter_%7C_GCP_%7C_Next.js-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 📌 The Vision
When disasters strike, local NGOs are overwhelmed with scattered data, and volunteers are underutilized. We built an AI-powered ecosystem to bridge this gap, addressing **SDG 11 (Sustainable Cities)**, **SDG 13 (Climate Action)**, and **SDG 17 (Partnerships)**.

## 🚀 Key Features
1. **Citizen Crowdsourcing Portal:** Locals upload photos of emergencies and receive unique tracking IDs.
2. **Gemini Anti-Spam Shield:** Google Gemini 1.5 Pro instantly analyzes images, verifies genuine emergencies, and extracts structured JSON (Severity, Coordinates).
3. **NGO Command Center:** A secure Next.js dashboard featuring a real-time Severity Heatmap using Google Maps Platform, protected by **Google Authentication**.
4. **Geospatial Dispatch:** Our FastAPI backend calculates distances using the Haversine formula to instantly match crises with the nearest qualified volunteers.
5. **Real-time Tracking**: Victims can track their responder's status and contact details in real-time.

## 🛠️ Google Technology Stack
* **AI/ML:** Google Gemini 1.5 Pro (Multimodal)
* **Backend Platform:** Google Cloud Run (Dockerized FastAPI)
* **Web Admin:** Next.js + Google Maps Platform (Visualization Library) + Firebase Auth
* **Mobile / Real-time:** Flutter + Firebase Cloud Firestore

## ⚙️ How to Demo / Run Locally

### 1. Environment Setup
Create a `.env.local` file in the `web-admin/` directory:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Execution
* **Backend:** `cd backend` -> `pip install -r requirements.txt` -> `uvicorn main:app --reload`
* **Web Admin:** `cd web-admin` -> `npm install` -> `npm run dev`
* **Mobile App:** `cd mobile_app` -> `flutter run`

---
### 📑 Documentation
For a deep dive into the technical architecture and project roadmap, please see the [**Project Handoff Report**](./project_handoff_report.md).

Built with ❤️ for the Google Solution Challenge 2026.
