'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 20.0,
  lng: 0.0
};

const libraries: ("visualization" | "places")[] = ["visualization"];

interface Task {
  task_id: string;
  title: string;
  description: string;
  category: string;
  severity_score: number;
  latitude: number;
  longitude: number;
}

interface MapProps {
  tasks: Task[];
}

export default function Map({ tasks }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(_map: google.maps.Map) {
    setMap(_map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">Loading Maps...</div>;

  const heatmapData = tasks.map(t => ({
    location: new google.maps.LatLng(t.latitude, t.longitude),
    weight: t.severity_score
  }));

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={2}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#242f3e" }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#242f3e" }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#746855" }]
          },
          {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#d59563" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#38414e" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#212a37" }]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9ca5b3" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#17263c" }]
          }
        ]
      }}
    >
      <HeatmapLayer
        data={heatmapData}
        options={{
          radius: 40,
          opacity: 0.6,
        }}
      />

      {tasks.map((task) => (
        <Marker
          key={task.task_id}
          position={{ lat: task.latitude, lng: task.longitude }}
          onClick={() => setSelectedTask(task)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: task.severity_score > 7 ? "#ef4444" : "#f97316",
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 10 + task.severity_score,
          }}
        />
      ))}

      {selectedTask && (
        <InfoWindow
          position={{ lat: selectedTask.latitude, lng: selectedTask.longitude }}
          onCloseClick={() => setSelectedTask(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-bold text-slate-900">{selectedTask.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{selectedTask.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                selectedTask.severity_score > 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                Severity: {selectedTask.severity_score}/10
              </span>
              <span className="text-xs text-slate-400 capitalize">{selectedTask.category}</span>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
