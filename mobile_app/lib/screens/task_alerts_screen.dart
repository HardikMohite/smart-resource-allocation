import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:mobile_app/main.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:developer' as developer;

class TaskAlertsScreen extends StatefulWidget {
  const TaskAlertsScreen({super.key});

  @override
  State<TaskAlertsScreen> createState() => _TaskAlertsScreenState();
}

class _TaskAlertsScreenState extends State<TaskAlertsScreen> {
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition();
      setState(() => _currentPosition = position);
    } catch (e) {
      developer.log('Location error: $e');
    }
  }

  double _calculateDistance(double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng) / 1000;
  }

  @override
  Widget build(BuildContext context) {
    User? user;
    if (isFirebaseInitialized) {
      try {
        user = FirebaseAuth.instance.currentUser;
      } catch (e) {
        developer.log('Firebase Auth not available');
      }
    }

    final String uid = user?.uid ?? "demo-volunteer-123";

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('tasks')
            .where('assigned_volunteer_uid', isEqualTo: uid)
            .where('status', isEqualTo: 'assigned')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final tasks = snapshot.data?.docs ?? [];
          if (tasks.isEmpty) return _buildEmptyState();

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: tasks.length,
            itemBuilder: (context, index) {
              final task = tasks[index].data() as Map<String, dynamic>;
              final taskId = tasks[index].id;
              final taskLat = (task['latitude'] as num).toDouble();
              final taskLng = (task['longitude'] as num).toDouble();
              
              double distance = 0;
              if (_currentPosition != null) {
                distance = _calculateDistance(_currentPosition!.latitude, _currentPosition!.longitude, taskLat, taskLng);
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: Colors.white10),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    _buildMissionHeader(distance),
                    _buildMissionMap(taskLat, taskLng),
                    _buildMissionDetails(task, taskId),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildMissionHeader(double distance) {
    return Container(
      padding: const EdgeInsets.all(20),
      color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
      child: Row(
        children: [
          const Icon(LucideIcons.zap, color: Color(0xFF3B82F6), size: 20),
          const SizedBox(width: 12),
          const Text('ACTIVE MISSION', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF3B82F6))),
          const Spacer(),
          Text('${distance.toStringAsFixed(1)} KM AWAY', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildMissionMap(double lat, double lng) {
    return SizedBox(
      height: 200,
      child: FlutterMap(
        options: MapOptions(initialCenter: LatLng(lat, lng), initialZoom: 13),
        children: [
          TileLayer(
            urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            subdomains: const ['a', 'b', 'c', 'd'],
          ),
          MarkerLayer(
            markers: [
              Marker(point: LatLng(lat, lng), width: 40, height: 40, child: const Icon(LucideIcons.mapPin, color: Colors.red, size: 32)),
              if (_currentPosition != null)
                Marker(point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude), width: 40, height: 40, child: const Icon(LucideIcons.navigation, color: Color(0xFF3B82F6), size: 24)),
            ],
          ),
          if (_currentPosition != null)
            PolylineLayer(
              polylines: <Polyline>[
                Polyline(
                  points: [LatLng(_currentPosition!.latitude, _currentPosition!.longitude), LatLng(lat, lng)],
                  color: const Color(0xFF3B82F6),
                  strokeWidth: 4,
                  borderStrokeWidth: 2,
                  borderColor: Colors.white24,
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildMissionDetails(Map<String, dynamic> task, String taskId) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(task['title']?.toString().toUpperCase() ?? 'DISASTER RESPONSE', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(task['description'] ?? '', style: const TextStyle(color: Colors.blueGrey, fontSize: 13)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () async => await FirebaseFirestore.instance.collection('tasks').doc(taskId).update({'status': 'resolved'}),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            child: const Text('MARK RESOLVED'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.shieldCheck, size: 48, color: Colors.blueGrey),
          SizedBox(height: 16),
          Text('ALL SECTORS SECURE', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
        ],
      ),
    );
  }
}
