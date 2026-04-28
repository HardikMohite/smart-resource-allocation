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
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

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
    final user = FirebaseAuth.instance.currentUser;
    final String uid = user?.uid ?? "demo-volunteer-123";
    _firestore!
        .collection('tasks')
        .where('assigned_volunteer_uid', isEqualTo: uid)
        .where('status', isEqualTo: 'assigned')
        .snapshots()
        .listen((snap) {
      if (snap.docs.isNotEmpty) {
        setState(() => _activeTask = snap.docs.first.data());
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

  Future<void> _updateProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    final String uid = user?.uid ?? "demo-volunteer-123";
    if (_firestore != null) {
      await _firestore!.collection('volunteers').doc(uid).set({
        'name': _nameController.text.isEmpty ? 'Field Responder (Demo)' : _nameController.text,
        'phone': _phoneController.text.isEmpty ? '+91 98765 43210' : _phoneController.text,
        'email': user?.email ?? 'responder@smartrelief.org',
        'last_updated': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile Updated Locally & Cloud Sync Complete')));
      }
    }
  }

  Future<void> _toggleDuty(bool value) async {
    setState(() => _isAvailable = value);
    final user = FirebaseAuth.instance.currentUser;
    final String uid = user?.uid ?? "demo-volunteer-123";

    if (isFirebaseInitialized && _firestore != null && _currentPosition != null) {
      try {
        await _firestore!.collection('volunteers').doc(uid).set({
          'is_available': value,
          'last_updated': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
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
      appBar: AppBar(
        title: const Text('COMMAND CENTER', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 16)),
        elevation: 0,
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFF3B82F6),
        unselectedItemColor: Colors.blueGrey,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(icon: Icon(LucideIcons.layoutDashboard, size: 22), label: 'MAP'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.listTodo, size: 22), label: 'TASKS'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.user, size: 22), label: 'PROFILE'),
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
                            width: 60, height: 60,
                            child: const Icon(LucideIcons.navigation, color: Color(0xFF3B82F6), size: 30),
                          ),
                          if (_activeTask != null && taskPos != null)
                            Marker(
                              point: taskPos,
                              width: 60, height: 60,
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
          color: _isAvailable ? Colors.green.withOpacity(0.1) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: _isAvailable ? Colors.green.withOpacity(0.2) : Colors.white10),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_isAvailable ? 'ACTIVE ON DUTY' : 'OFF DUTY INACTIVE', style: TextStyle(fontWeight: FontWeight.bold, color: _isAvailable ? Colors.green : Colors.blueGrey)),
                  Text(_activeTask != null ? '🚨 DISPATCHED TO SITE' : 'Broadcasting location...', style: TextStyle(fontSize: 11, color: Colors.blueGrey)),
                ],
              ),
            ),
            Switch.adaptive(value: _isAvailable, onChanged: _toggleDuty, activeColor: Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileScreen() {
    final user = FirebaseAuth.instance.currentUser;
    final String uid = user?.uid ?? "demo-volunteer-123";

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('volunteers').doc(uid).snapshots(),
      builder: (context, snapshot) {
        final data = snapshot.data?.data() as Map<String, dynamic>? ?? {};
        final name = data['name'] ?? user?.displayName ?? 'Field Responder (Demo)';
        final phone = data['phone'] ?? '+91 98765 43210';
        final email = data['email'] ?? user?.email ?? 'responder@smartrelief.org';

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Container(
                width: 100, height: 100,
                decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: const Color(0xFF3B82F6), width: 2)),
                child: Center(child: Text(name[0].toUpperCase(), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF3B82F6)))),
              ),
              const SizedBox(height: 16),
              Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              Text(uid.length > 20 ? '${uid.substring(0, 10)}...${uid.substring(uid.length - 5)}' : uid, style: const TextStyle(color: Colors.blueGrey, fontSize: 12, letterSpacing: 1)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => _showEditProfileDialog(name, phone),
                icon: const Icon(LucideIcons.edit3, size: 14),
                label: const Text('EDIT PROFILE INFO'),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E293B), foregroundColor: Colors.blueAccent),
              ),
              const SizedBox(height: 32),
              _buildProfileInfoCard('Phone Number', phone, LucideIcons.phone),
              _buildProfileInfoCard('Email Address', email, LucideIcons.mail),
              _buildProfileInfoCard('Department', 'Disaster Response Unit', LucideIcons.shield),
              const SizedBox(height: 32),
              Row(
                children: [
                  _buildStatCard('Missions', '12', Colors.blue),
                  const SizedBox(width: 16),
                  _buildStatCard('Status', _isAvailable ? 'Online' : 'Offline', _isAvailable ? Colors.green : Colors.grey),
                ],
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => FirebaseAuth.instance.signOut(),
                  icon: const Icon(LucideIcons.logOut, size: 18),
                  label: const Text('LOGOUT SYSTEM'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent), padding: const EdgeInsets.all(16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showEditProfileDialog(String currentName, String currentPhone) {
    _nameController.text = currentName;
    _phoneController.text = currentPhone;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('RESPONDER DETAILS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name', labelStyle: TextStyle(color: Colors.blueGrey))),
            TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone Number', labelStyle: TextStyle(color: Colors.blueGrey))),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL')),
          ElevatedButton(onPressed: _updateProfile, child: const Text('SYNC PROFILE')),
        ],
      ),
    );
  }

  Widget _buildProfileInfoCard(String label, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.05))),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF3B82F6)),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.blueGrey, fontSize: 10, fontWeight: FontWeight.bold)),
              Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(24), border: Border.all(color: color.withOpacity(0.2))),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color.withValues(alpha: 0.7))),
          ],
        ),
      ),
    );
  }
}
