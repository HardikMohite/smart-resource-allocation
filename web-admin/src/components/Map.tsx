'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const VolunteerIcon = (rotation: number) => L.divIcon({
  className: 'custom-volunteer-icon',
  html: `<div style="transform: rotate(${rotation}deg); color: #3b82f6; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
            <path d="M12 2l-10 20 10-4 10 4-10-20z"/>
          </svg>
        </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const TaskIcon = (severity: number, status: string) => L.divIcon({
  className: 'custom-task-icon',
  html: `<div style="
          width: ${12 + severity}px; 
          height: ${12 + severity}px; 
          background: ${status === 'assigned' ? '#10b981' : (severity > 7 ? '#ef4444' : '#f97316')}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 15px ${status === 'assigned' ? '#10b981' : (severity > 7 ? '#ef4444' : '#f97316')};
          animation: pulse 2s infinite;
        "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Task {
  id: string;
  task_id: string;
  title: string;
  description: string;
  category: string;
  severity_score: number;
  latitude: number;
  longitude: number;
  status: string;
  assigned_volunteer_name?: string;
}

interface Volunteer {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  is_available: boolean;
}

interface MapProps {
  tasks: Task[];
  volunteers: Volunteer[];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function Map({ tasks, volunteers }: MapProps) {
  const center: [number, number] = [19.0760, 72.8777];

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        {/* Premium Dark Mode Tiles (No API Key Required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater center={center} />

        {/* Task Markers */}
        {tasks.map((task) => (
          <Marker 
            key={task.id} 
            position={[task.latitude, task.longitude]}
            icon={TaskIcon(task.severity_score, task.status)}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-slate-900">{task.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                {task.status === 'assigned' && (
                  <div className="mt-2 text-[10px] font-bold text-green-600 uppercase">
                    Assigned: {task.assigned_volunteer_name}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Volunteer Markers */}
        {volunteers.map((v) => (
          <Marker 
            key={v.id} 
            position={[v.location.latitude, v.location.longitude]}
            icon={VolunteerIcon(45)}
          >
            <Popup>
              <div className="p-1">
                <p className="text-[10px] font-black text-blue-600 uppercase">Responder</p>
                <h3 className="font-bold text-slate-900">{v.name}</h3>
                <p className="text-[10px] text-green-500 font-bold mt-1">● Online Now</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Paths removed from web map per user request - Mobile App is now the primary navigation tool */}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          padding: 4px;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
