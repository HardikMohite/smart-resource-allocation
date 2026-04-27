import 'package:flutter/material.dart';
import 'package:mobile_app/main.dart';
import 'package:mobile_app/screens/task_alerts_screen.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'dart:developer' as developer;

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  bool _isAvailable = false;
  FirebaseFirestore? _firestore;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    if (isFirebaseInitialized) {
      try {
        _firestore = FirebaseFirestore.instance;
      } catch (e) {
        developer.log('Firestore not available in Demo Mode');
      }
    }
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    final position = await Geolocator.getCurrentPosition();
    if (!mounted) return;
    setState(() {
      _currentPosition = position;
    });
    
    _mapController?.animateCamera(
      CameraUpdate.newLatLng(
        LatLng(position.latitude, position.longitude),
      ),
    );
  }

  Future<void> _toggleDuty(bool value) async {
    setState(() {
      _isAvailable = value;
    });

    if (!isFirebaseInitialized || _firestore == null) {
      developer.log('Demo Mode: Skipping Firestore update');
    } else {
      try {
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          await _firestore!.collection('volunteers').doc(user.uid).update({
            'is_available': value,
            'location': GeoPoint(_currentPosition!.latitude, _currentPosition!.longitude),
            'last_updated': FieldValue.serverTimestamp(),
          });
        }
      } catch (e) {
        developer.log('Firebase Error: $e');
      }
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(value ? 'YOU ARE NOW ON DUTY' : 'YOU ARE NOW OFF DUTY', 
          style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.0)),
        backgroundColor: value ? const Color(0xFF10B981) : const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(20),
      ),
    );
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
        title: const Text('COMMAND CENTER'),
        actions: [
          IconButton(
            onPressed: () {},
            icon: Icon(LucideIcons.bell, size: 20),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF3B82F6),
          unselectedItemColor: Colors.blueGrey.shade600,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1.0),
          unselectedLabelStyle: const TextStyle(fontSize: 10, letterSpacing: 1.0),
          items: [
            BottomNavigationBarItem(icon: Icon(LucideIcons.layoutDashboard, size: 20), label: 'MAP'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.listTodo, size: 20), label: 'TASKS'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.user, size: 20), label: 'PROFILE'),
          ],
        ),
      ),
    );
  }

  Widget _buildMainDashboard() {
    return Column(
      children: [
        // Duty Status Header (Glassmorphism effect)
        Padding(
          padding: const EdgeInsets.all(20),
          child: Container(
            decoration: BoxDecoration(
              color: _isAvailable 
                ? const Color(0xFF10B981).withValues(alpha: 0.1) 
                : const Color(0xFF334155).withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: _isAvailable 
                  ? const Color(0xFF10B981).withValues(alpha: 0.2) 
                  : const Color(0xFF475569).withValues(alpha: 0.3),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: _isAvailable ? const Color(0xFF10B981) : Colors.blueGrey.shade600,
                      shape: BoxShape.circle,
                      boxShadow: _isAvailable ? [
                        BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.5), blurRadius: 10, spreadRadius: 2)
                      ] : [],
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isAvailable ? 'ACTIVE ON DUTY' : 'OFF DUTY INACTIVE',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            color: _isAvailable ? const Color(0xFF10B981) : Colors.blueGrey.shade400,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isAvailable ? 'Broadcasting live location...' : 'Enable duty to receive dispatches',
                          style: TextStyle(fontSize: 11, color: Colors.blueGrey.shade500, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  Switch.adaptive(
                    value: _isAvailable,
                    onChanged: _toggleDuty,
                    activeThumbColor: const Color(0xFF10B981),
                    activeTrackColor: const Color(0xFF10B981).withValues(alpha: 0.5),
                  ),
                ],
              ),
            ),
          ),
        ),
        
        // Map Container
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Stack(
              children: [
                _currentPosition == null
                    ? const Center(child: CircularProgressIndicator())
                    : GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                          zoom: 15,
                        ),
                        onMapCreated: (controller) => _mapController = controller,
                        myLocationEnabled: true,
                        myLocationButtonEnabled: false,
                        zoomControlsEnabled: false,
                        style: _darkMapStyle, // In real app, load from json
                      ),
                
                // Overlay Controls
                Positioned(
                  bottom: 24,
                  right: 24,
                  child: Column(
                    children: [
                      _buildMapFab(LucideIcons.layers, () {}),
                      const SizedBox(height: 12),
                      _buildMapFab(LucideIcons.navigation, _getCurrentLocation, isPrimary: true),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMapFab(IconData icon, VoidCallback onPressed, {bool isPrimary = false}) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
          border: Border.all(color: isPrimary ? Colors.transparent : Colors.white.withValues(alpha: 0.05)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildProfileScreen() {
    return Center(
      child: Text('Profile Screen - NGO Admin', style: TextStyle(color: Colors.blueGrey.shade400)),
    );
  }

  // Placeholder for Google Maps Dark Style JSON
  final String? _darkMapStyle = null; 
}
