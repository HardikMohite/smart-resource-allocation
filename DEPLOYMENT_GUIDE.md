# 🚀 SmartRelief Deployment Guide

Follow these steps to take the SmartRelief NGO Command Center live on **Vercel**.

## 1. Vercel Project Setup
1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import the `smart-resource-allocation` repository.
4. **IMPORTANT**: In the "Framework Preset" settings:
   - **Root Directory**: Click "Edit" and select the `web-admin` folder.

## 2. Environment Variables (CRITICAL)
Copy the following keys from your `.env.local` and paste them into the Vercel **Environment Variables** section:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | (Your API Key) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | (Your Auth Domain) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | (Your Project ID) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | (Your Bucket) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (Your ID) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | (Your App ID) |
| `JWT_SECRET` | `smart_relief_emergency_response_secret_2026_key` |

## 3. Build & Deploy
1. Click **Deploy**.
2. Once finished, you will receive a professional URL (e.g., `https://smart-relief-web.vercel.app`).

---

## 🛡️ Support Notes
- **Firebase Rules**: Ensure your Firestore rules allow read/write so the live site can talk to the database.
- **Maps**: The dashboard uses Leaflet, so no extra Google Maps billing is required for the web view!

**Good luck with the Hackathon submission!** 🛡️✨🌍🏆
