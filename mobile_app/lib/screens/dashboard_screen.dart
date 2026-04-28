import 'package:flutter/material.dart';
import 'package:mobile_app/main.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/screens/task_alerts_screen.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:developer' as developer;

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final MapController _mapController = MapController();
  Position? _currentPosition;
  bool _isAvailable = false;
  FirebaseFirestore? _firestore;
  int _currentIndex = 0;
  Map<String, dynamic>? _activeTask;

  // Minimum GPS accuracy (metres) required before we trust a fix.
  static const double _minAccuracyMetres = 100.0;

  @override
  void initState() {
    super.initState();

    // ── Secondary auth guard ──────────────────────────────────────────────
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final user = FirebaseAuth.instance.currentUser;
      // Kick back to login if unauthenticated OR email not verified.
      // (Google accounts always have emailVerified == true, so they pass.)
      final needsLogin = user == null || !user.emailVerified;
      if (needsLogin && isFirebaseInitialized) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    });

    if (isFirebaseInitialized) {
      try {
        _firestore = FirebaseFirestore.instance;
        _startMissionListener();
      } catch (e) {
        developer.log('Firestore initialization failed: $e');
      }
    }
    _getCurrentLocation();
  }

  void _startMissionListener() {
    // Stable ID for the demo to ensure Swiggy-style sync
    const String demoUid = "demo-volunteer-123";
    
    _firestore!
        .collection('tasks')
        .where('assigned_volunteer_uid', isEqualTo: demoUid)
        .where('status', isEqualTo: 'assigned')
        .snapshots()
        .listen((snap) {
      if (snap.docs.isNotEmpty) {
        developer.log('🚨 [DISPATCH RECEIVED] New mission assigned to this device!');
        setState(() => _activeTask = snap.docs.first.data());
        
        // Show a "Zomato-style" mission alert
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🚨 NEW MISSION DISPATCHED: PROCEED TO SITE'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 5),
            ),
          );
        }
      } else {
        setState(() => _activeTask = null);
      }
    });
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      setState(() => _currentPosition = position);
      _mapController.move(LatLng(position.latitude, position.longitude), 15);
    } catch (e) {
      developer.log('Location error: $e');
    }
  }

  Future<void> _toggleDuty(bool value) async {
    setState(() => _isAvailable = value);

    if (isFirebaseInitialized && _firestore != null && _currentPosition != null) {
      try {
        const String demoUid = "demo-volunteer-123";
        await _firestore!.collection('volunteers').doc(demoUid).set({
          'name': 'Field Responder (Demo)',
          'is_available': value,
          'last_updated': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
        developer.log('🚀 [SYNC] On-Duty: $value');
      } catch (e) {
        developer.log('❌ [SYNC ERROR] $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildMainDashboard(),
      const TaskAlertsScreen(),
      _buildProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('COMMAND CENTER')),
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFF3B82F6),
        items: [
          BottomNavigationBarItem(icon: Icon(LucideIcons.layoutDashboard, size: 20), label: 'MAP'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.listTodo, size: 20), label: 'TASKS'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.user, size: 20), label: 'PROFILE'),
        ],
      ),
    );
  }

  Widget _buildMainDashboard() {
    LatLng? taskPos;
    if (_activeTask != null) {
      taskPos = LatLng((_activeTask!['latitude'] as num).toDouble(), (_activeTask!['longitude'] as num).toDouble());
    }

    return Column(
      children: [
        _buildDutyToggle(),
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border.all(color: Colors.white10),
            ),
            child: _currentPosition == null
                ? const Center(child: CircularProgressIndicator())
                : FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                      initialZoom: 14,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                        subdomains: const ['a', 'b', 'c', 'd'],
                      ),
                      if (_activeTask != null && taskPos != null)
                        PolylineLayer(
                          polylines: [
                            Polyline(
                              points: [LatLng(_currentPosition!.latitude, _currentPosition!.longitude), taskPos],
                              color: const Color(0xFF3B82F6),
                              strokeWidth: 5,
                              borderStrokeWidth: 3,
                              borderColor: Colors.white,
                            ),
                          ],
                        ),
                      MarkerLayer(
                        markers: [
                          Marker(
                            point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                            width: 60,
                            height: 60,
                            child: const Icon(LucideIcons.navigation, color: Color(0xFF3B82F6), size: 30),
                          ),
                          if (_activeTask != null && taskPos != null)
                            Marker(
                              point: taskPos,
                              width: 60,
                              height: 60,
                              child: const Icon(LucideIcons.mapPin, color: Colors.red, size: 36),
                            ),
                        ],
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildDutyToggle() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: _isAvailable ? Colors.green.withValues(alpha: 0.1) : const Color(0xFF64748B).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: _isAvailable ? Colors.green.withValues(alpha: 0.2) : Colors.white10),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_isAvailable ? 'ACTIVE ON DUTY' : 'OFF DUTY INACTIVE', style: TextStyle(fontWeight: FontWeight.bold, color: _isAvailable ? Colors.green : Colors.blueGrey)),
                  Text(_activeTask != null ? '🚨 DISPATCHED TO SITE' : 'Broadcasting live location...', style: TextStyle(fontSize: 11, color: _activeTask != null ? Colors.orange : Colors.blueGrey)),
                ],
              ),
            ),
            Switch.adaptive(value: _isAvailable, onChanged: _toggleDuty, activeColor: Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileScreen() => const Center(child: Text('Profile Screen'));
}
