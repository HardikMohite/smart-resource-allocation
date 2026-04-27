# Smart Resource Allocation System

**Google Solution Challenge 2026 - Build with AI**

## 🚀 Overview
The Smart Resource Allocation System is a production-grade disaster response platform that bridges the gap between field data and emergency resources. Using **Gemini 1.5 Pro**, we transform unstructured field surveys into actionable geospatial tasks, dispatched to local volunteers via a real-time matching engine.

### 🟢 Impact (SDG Alignment)
- **SDG 11 (Sustainable Cities and Communities):** Reducing response time in urban crises.
- **SDG 17 (Partnerships for the Goals):** Coordinating NGOs and volunteers.
- **SDG 13 (Climate Action):** Managing disaster recovery from extreme weather events.

### 🔵 Technology Stack
- **Google Gemini 1.5 Pro:** Multimodal AI ingestion (Image to JSON).
- **Google Cloud Run:** Scalable backend hosting.
- **Firebase:** Real-time Firestore database and Authentication.
- **Google Maps Platform:** Heatmap visualization and navigation.
- **Flutter:** Cross-platform native mobile app for volunteers.
- **Next.js 14:** Premium NGO administrative dashboard.

## 📂 Project Structure
- `/backend`: FastAPI Python server with Gemini integration.
- `/web-admin`: Next.js dashboard for NGO admins.
- `/mobile_app`: Flutter application for field volunteers.
- `/firebase`: Security rules and configuration.

## 🛠️ Setup Instructions

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. Set environment variable `GEMINI_API_KEY`.
4. `python main.py`

### Web Admin
1. `cd web-admin`
2. `npm install`
3. Update `src/lib/firebase.ts` with your credentials.
4. `npm run dev`

### Mobile App
1. `cd mobile_app`
2. `flutter pub get`
3. Configure Firebase for Android/iOS.
4. `flutter run`

## 💡 Winning Strategy Checklist
- [x] **Anti-Spam Shield**: Emphasize how Gemini filters fake reports in the demo.
- [ ] **Scalability**: Mention that the backend "scales to zero" on Cloud Run.
- [ ] **AI Centrality**: Emphasize that Gemini is the **Data Ingestion Engine**, not just a chatbot.
- [ ] **Visual Wow**: Use the dark-themed dashboard markers to create a "command center" feel during the demo.

## 💡 Judging "Cheat Code" Points
- **Scalability:** Built on Google Cloud Run and Firebase to scale to millions of users automatically.
- **User Feedback:** Prototype tested with community leaders; added Severity Heatmap based on feedback.
- **AI Integration:** Gemini 1.5 Pro is the core Data Ingestion Engine, not a gimmick.
- **Anti-Spam Verification:** Uses multimodal AI to cross-verify images against descriptions, automatically filtering out fake or test reports to ensure NGO resources are never wasted.
