import os
import uuid
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
from pydantic import BaseModel
from geopy.distance import geodesic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Smart Resource Allocation API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
# Note: Use default credentials for GCP Cloud Run compatibility
try:
    firebase_admin.initialize_app()
    db = firestore.client()
    print("Firebase initialized successfully.")
except Exception as e:
    print(f"Warning: Firebase could not be initialized. {e}")
    db = None

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not set. AI features will fail.")
genai.configure(api_key=GEMINI_API_KEY)

# Pydantic models for strict typing
class TaskSchema(BaseModel):
    title: str
    description: str
    category: str
    severity_score: int
    latitude: float
    longitude: float

class VolunteerMatch(BaseModel):
    uid: str
    name: str
    distance_km: float
    skills: List[str]
    match_score: float

@app.post("/api/v1/surveys/process", response_model=dict)
async def process_survey(file: UploadFile = File(...)):
    """
    Processes a field survey image using Gemini 1.5 Pro and saves to Firestore.
    """
    try:
        # Read image content
        image_data = await file.read()
        
        # Prepare Gemini model
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Strict JSON schema enforcement
        prompt = """
        Analyze this disaster relief field survey image. 
        Extract the information into a strict JSON format with the following fields:
        {
          "title": "Short descriptive title",
          "description": "Detailed description of the issue",
          "category": "One of: Medical, Food, Infrastructure, Rescue, Water",
          "severity_score": 1-10 (integer),
          "latitude": float,
          "longitude": float
        }
        If coordinates are not visible, estimate based on context or return 0.0.
        """
        
        # Generate response using structured output config
        response = model.generate_content(
            [prompt, {"mime_type": "image/jpeg", "data": image_data}],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        # Parse Gemini JSON output
        task_data = json.loads(response.text)
        
        # Add metadata and save to Firestore
        if db:
            task_id = str(uuid.uuid4())
            task_ref = db.collection('tasks').document(task_id)
            task_record = {
                **task_data,
                "task_id": task_id,
                "status": "open",
                "created_at": firestore.SERVER_TIMESTAMP
            }
            task_ref.set(task_record)
        else:
            task_id = "mock-task-id-" + str(uuid.uuid4())[:8]
            print(f"Dry run: Task {task_id} would be saved to Firestore.")
        
        return {"status": "success", "task_id": task_id, "data": task_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing failed: {str(e)}")

@app.get("/api/v1/tasks/{task_id}/match", response_model=List[VolunteerMatch])
async def match_volunteers(task_id: str):
    """
    Calculates the best volunteer matches for a task using Geospatial mathematics.
    """
    if not db:
        return [
            VolunteerMatch(uid="v1", name="Demo Volunteer (Nearby)", distance_km=1.2, skills=["Medical"], match_score=0.95),
            VolunteerMatch(uid="v2", name="Demo Volunteer (Fast)", distance_km=3.5, skills=["Rescue"], match_score=0.82)
        ]

    try:
        # Fetch task details
        task_ref = db.collection('tasks').document(task_id).get()
        if not task_ref.exists:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = task_ref.to_dict()
        task_coords = (task['latitude'], task['longitude'])
        task_category = task['category']

        # Fetch available volunteers
        volunteers_ref = db.collection('volunteers').where('is_available', '==', True).stream()
        
        matches = []
        for doc in volunteers_ref:
            v_data = doc.to_dict()
            v_coords = (v_data['location'].latitude, v_data['location'].longitude)
            
            # Calculate distance using Haversine formula (geopy)
            distance = geodesic(task_coords, v_coords).kilometers
            
            # Filter by radius (e.g., 10km)
            if distance <= 10.0:
                # Simple matching score: skill match (50%) + proximity (50%)
                skill_match = 1.0 if task_category in v_data.get('skills', []) else 0.0
                proximity_score = max(0, (10 - distance) / 10)
                
                match_score = (skill_match * 0.6) + (proximity_score * 0.4)
                
                matches.append(VolunteerMatch(
                    uid=doc.id,
                    name=v_data.get('name', 'Unknown'),
                    distance_km=round(distance, 2),
                    skills=v_data.get('skills', []),
                    match_score=round(match_score, 2)
                ))

        # Rank by match score descending
        matches.sort(key=lambda x: x.match_score, reverse=True)
        
        return matches[:5]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching algorithm failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
