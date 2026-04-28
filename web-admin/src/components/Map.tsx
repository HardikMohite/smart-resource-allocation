'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer, Polyline } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 19.0760, // Default to Mumbai for better demo
  lng: 72.8777
};

const libraries: ("visualization" | "places")[] = ["visualization"];

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
  assigned_volunteer_phone?: string;
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

export default function Map({ tasks, volunteers }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(_map: google.maps.Map) {
    setMap(_map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const heatmapData = React.useMemo(() => {
    if (!isLoaded || typeof google === 'undefined') return [];
    return tasks.map(t => ({
      location: new google.maps.LatLng(t.latitude, t.longitude),
      weight: t.severity_score
    }));
  }, [tasks, isLoaded]);

  if (!isLoaded) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">Loading Maps...</div>;

  return (
    <div className="h-full w-full relative" style={{ zIndex: 1 }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          clickableIcons: false,
          disableDefaultUI: false,
          styles: [
            { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
          ]
        }}
      >
        <HeatmapLayer data={heatmapData} options={{ radius: 40, opacity: 0.6 }} />

        {/* Task Markers */}
        {tasks.map((task) => (
          <Marker
            key={task.task_id}
            position={{ lat: task.latitude, lng: task.longitude }}
            onClick={() => { setSelectedTask(task); setSelectedVolunteer(null); }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: task.status === 'assigned' ? "#10b981" : (task.severity_score > 7 ? "#ef4444" : "#f97316"),
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: "#ffffff",
              scale: 10 + task.severity_score,
            }}
          />
        ))}

        {/* Volunteer Markers (SYNC MODE) */}
        {volunteers.map((v) => (
          <Marker
            key={v.id}
            position={{ lat: v.location.latitude, lng: v.location.longitude }}
            onClick={() => { setSelectedVolunteer(v); setSelectedTask(null); }}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#ffffff",
              scale: 5,
              rotation: 45
            }}
          />
        ))}

        {/* Task Path */}
        {tasks.filter(t => t.status === 'assigned').map((task) => (
          <Polyline
            key={`path-${task.task_id}`}
            path={[
              { lat: task.latitude, lng: task.longitude },
              { lat: task.latitude + (Math.random() * 0.02 - 0.01), lng: task.longitude + (Math.random() * 0.02 - 0.01) }
            ]}
            options={{
              strokeColor: "#10b981",
              strokeOpacity: 0.8,
              strokeWeight: 3,
              icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }]
            }}
          />
        ))}

        {/* Info Windows */}
        {selectedTask && (
          <InfoWindow position={{ lat: selectedTask.latitude, lng: selectedTask.longitude }} onCloseClick={() => setSelectedTask(null)}>
            <div className="p-3 max-w-[200px]">
              <h3 className="font-bold text-slate-900 leading-tight">{selectedTask.title}</h3>
              {selectedTask.status === 'assigned' ? (
                <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-[10px] font-black text-green-700 uppercase">Assigned To</p>
                  <p className="text-xs font-bold text-slate-800">{selectedTask.assigned_volunteer_name}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{selectedTask.description}</p>
              )}
            </div>
          </InfoWindow>
        )}

        {selectedVolunteer && (
          <InfoWindow position={{ lat: selectedVolunteer.location.latitude, lng: selectedVolunteer.location.longitude }} onCloseClick={() => setSelectedVolunteer(null)}>
            <div className="p-3">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Volunteer</p>
              <h3 className="font-bold text-slate-900">{selectedVolunteer.name}</h3>
              <p className="text-[10px] text-green-500 font-bold mt-1 uppercase">● Available On-Duty</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
