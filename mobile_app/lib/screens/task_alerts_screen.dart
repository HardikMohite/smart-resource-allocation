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
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

          final allTasks = snapshot.data?.docs ?? [];
          final ongoing = allTasks.where((d) => (d.data() as Map)['status'] == 'assigned').toList();
          final resolved = allTasks.where((d) => (d.data() as Map)['status'] == 'resolved').toList();

          if (allTasks.isEmpty) return _buildEmptyState();

          return CustomScrollView(
            slivers: [
              // ONGOING MISSIONS HEADER
              if (ongoing.isNotEmpty)
                _buildSliverHeader('🚨 ONGOING MISSIONS', Colors.redAccent),
              
              if (ongoing.isNotEmpty)
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildOngoingTaskCard(ongoing[index]),
                    childCount: ongoing.length,
                  ),
                ),

              // HISTORY HEADER
              if (resolved.isNotEmpty)
                _buildSliverHeader('✅ MISSION HISTORY', Colors.greenAccent),

              if (resolved.isNotEmpty)
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _buildPastTaskCard(resolved[index]),
                    childCount: resolved.length,
                  ),
                ),
                
              const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSliverHeader(String title, Color color) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
        child: Text(
          title,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w900,
            letterSpacing: 2.0,
          ),
        ),
      ),
    );
  }

  Widget _buildOngoingTaskCard(DocumentSnapshot doc) {
    final task = doc.data() as Map<String, dynamic>;
    final taskId = doc.id;
    final taskLat = (task['latitude'] as num).toDouble();
    final taskLng = (task['longitude'] as num).toDouble();
    
    double distance = 0;
    if (_currentPosition != null) {
      distance = _calculateDistance(_currentPosition!.latitude, _currentPosition!.longitude, taskLat, taskLng);
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _buildMissionMap(taskLat, taskLng),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(task['title']?.toString().toUpperCase() ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                    Text('${distance.toStringAsFixed(1)} KM', style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(task['description'] ?? '', style: const TextStyle(color: Colors.blueGrey, fontSize: 13)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async => await FirebaseFirestore.instance.collection('tasks').doc(taskId).update({'status': 'resolved'}),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.all(16)),
                    child: const Text('MARK RESOLVED'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPastTaskCard(DocumentSnapshot doc) {
    final task = doc.data() as Map<String, dynamic>;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.5),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(LucideIcons.checkCircle, color: Colors.green, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(task['title'] ?? 'Past Mission', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text('Mission Accomplished', style: TextStyle(color: Colors.green.withOpacity(0.7), fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronRight, color: Colors.blueGrey, size: 16),
        ],
      ),
    );
  }

  Widget _buildMissionMap(double lat, double lng) {
    return SizedBox(
      height: 180,
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

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.shieldCheck, size: 48, color: Colors.blueGrey),
          SizedBox(height: 16),
          Text('NO MISSIONS LOGGED', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
          Text('Awaiting signal from Command Center...', style: TextStyle(color: Colors.blueGrey, fontSize: 12)),
        ],
      ),
    );
  }
}
