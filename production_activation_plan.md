# Production Activation Plan

To move the **Smart Resource Allocation System** from "Demo Mode" to "Active Production," follow these three critical steps.

## 1. Activate the Real Database (Firebase)
Currently, the system uses mock data because the Firebase connection is not finalized.

### For the Web Admin:
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Create a Web App and copy the `firebaseConfig` object.
3. Update `web-admin/src/lib/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... paste the rest here
   };
   ```

### For the Backend (Cloud Run):
1. Go to **Project Settings > Service Accounts**.
2. Click **Generate New Private Key**.
3. Save the file as `serviceAccountKey.json` in the `/backend` directory.
4. The system will automatically detect this file and start using real Firestore data.

---

## 2. Activate the Live Matching Engine
The matching engine is currently running on `localhost:8000`. To make it accessible to the world:

1. **Deploy to Google Cloud Run**:
   ```bash
   cd backend
   gcloud run deploy smart-resource-api --source .
   ```
2. **Update the Web Admin**:
   Copy the URL provided by Cloud Run (e.g., `https://smart-resource-api-xyz.a.run.app`) and update the `fetch` URL in `web-admin/src/app/page.tsx`:
   ```javascript
   // Change from localhost:8000 to your Cloud Run URL
   const response = await fetch(`https://your-cloud-run-url.com/api/v1/tasks/${task.task_id}/match`);
   ```

---

## 3. Activate the Volunteer App (Flutter)
1. Install the [FlutterFire CLI](https://firebase.google.com/docs/flutter/setup).
2. Run this command in the `mobile_app` folder:
   ```bash
   flutterfire configure
   ```
3. This will generate `firebase_options.dart` and allow the app to broadcast real GPS locations to your NGO Dashboard.

---

## 🚀 Final Production Check
Once these steps are done, the dashboard will stop showing "Demo Mode" and will display **live, real-time data** from volunteers in the field.
