import 'package:flutter/material.dart';
import 'package:mobile_app/main.dart';
import 'package:mobile_app/screens/login_screen.dart';
import 'package:mobile_app/screens/task_alerts_screen.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
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
  GoogleMapController? _mapController;
  Position? _currentPosition;
  bool _isAvailable = false;
  FirebaseFirestore? _firestore;
  int _currentIndex = 0;

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
      } catch (e) {
        developer.log('Firestore unavailable: $e');
      }
    }
    _getCurrentLocation();
  }

  // ── Sign out ─────────────────────────────────────────────────────────────
  Future<void> _handleSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(LucideIcons.logOut, color: Color(0xFFEF4444), size: 20),
            SizedBox(width: 10),
            Text('Sign out?',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: Text(
          'You will be returned to the login screen and your active-duty '
          'status will stop broadcasting.',
          style: TextStyle(
              color: Colors.blueGrey.shade400, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Cancel',
                style: TextStyle(color: Colors.blueGrey.shade400)),
          ),
          SizedBox(
            width: 100,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(0, 40),
              ),
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Sign out'),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await GoogleSignIn().signOut();
      await FirebaseAuth.instance.signOut();
      // StreamBuilder in main.dart auto-navigates back to LoginScreen.
    } catch (e) {
      developer.log('Sign-out error: $e');
    }
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

    final position = await Geolocator.getCurrentPosition(
      // Request high accuracy so accuracy values are meaningful.
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );

    // Only accept the fix if it is accurate enough.
    if (position.accuracy > _minAccuracyMetres) {
      developer.log(
          '⚠️ GPS fix rejected — accuracy ${position.accuracy}m > $_minAccuracyMetres m threshold');
      return;
    }

    if (!mounted) return;
    setState(() => _currentPosition = position);

    _mapController?.animateCamera(
      CameraUpdate.newLatLng(
        LatLng(position.latitude, position.longitude),
      ),
    );
  }

  Future<void> _toggleDuty(bool value) async {
    setState(() => _isAvailable = value);

    if (!isFirebaseInitialized || _firestore == null) {
      developer.log('Skipping Firestore update — Firebase not initialized');
    } else {
      try {
        final user = FirebaseAuth.instance.currentUser;
        if (user == null) return; // Should never happen; guard anyway.

        final Map<String, dynamic> data = {
          'name': user.displayName ?? 'Field Responder',
          'is_available': value,
          'last_updated': FieldValue.serverTimestamp(),
          // FIX: phone removed — no hardcoded placeholder.
          // A real phone field should be written once from a verified
          // profile-update screen, not on every duty toggle.
        };

        // Only include location when we have a fresh, accurate fix.
        if (_currentPosition != null) {
          data['location'] = GeoPoint(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          );
        }

        await _firestore!
            .collection('volunteers')
            .doc(user.uid)
            .set(data, SetOptions(merge: true));

        developer.log('🚀 [SYNC] is_available=$value');
      } catch (e) {
        developer.log('❌ [SYNC ERROR] $e');
      }
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          value ? 'YOU ARE NOW ON DUTY' : 'YOU ARE NOW OFF DUTY',
          style: const TextStyle(
              fontWeight: FontWeight.bold, letterSpacing: 1.0),
        ),
        backgroundColor:
            value ? const Color(0xFF10B981) : const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
            icon: const Icon(LucideIcons.bell, size: 20),
          ),
          IconButton(
            onPressed: _handleSignOut,
            icon: const Icon(LucideIcons.logOut, size: 20),
            tooltip: 'Sign out',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF3B82F6),
          unselectedItemColor: Colors.blueGrey.shade600,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 10,
              letterSpacing: 1.0),
          unselectedLabelStyle:
              const TextStyle(fontSize: 10, letterSpacing: 1.0),
          items: [
            BottomNavigationBarItem(
                icon: const Icon(LucideIcons.layoutDashboard, size: 20),
                label: 'MAP'),
            BottomNavigationBarItem(
                icon: const Icon(LucideIcons.listTodo, size: 20),
                label: 'TASKS'),
            BottomNavigationBarItem(
                icon: const Icon(LucideIcons.user, size: 20),
                label: 'PROFILE'),
          ],
        ),
      ),
    );
  }

  Widget _buildMainDashboard() {
    return Column(
      children: [
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
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: _isAvailable
                          ? const Color(0xFF10B981)
                          : Colors.blueGrey.shade600,
                      shape: BoxShape.circle,
                      boxShadow: _isAvailable
                          ? [
                              BoxShadow(
                                  color: const Color(0xFF10B981)
                                      .withValues(alpha: 0.5),
                                  blurRadius: 10,
                                  spreadRadius: 2)
                            ]
                          : [],
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isAvailable
                              ? 'ACTIVE ON DUTY'
                              : 'OFF DUTY INACTIVE',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            color: _isAvailable
                                ? const Color(0xFF10B981)
                                : Colors.blueGrey.shade400,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isAvailable
                              ? 'Broadcasting live location...'
                              : 'Enable duty to receive dispatches',
                          style: TextStyle(
                              fontSize: 11,
                              color: Colors.blueGrey.shade500,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  Switch.adaptive(
                    value: _isAvailable,
                    onChanged: _toggleDuty,
                    activeThumbColor: const Color(0xFF10B981),
                    activeTrackColor:
                        const Color(0xFF10B981).withValues(alpha: 0.5),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(32)),
              border:
                  Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Stack(
              children: [
                _currentPosition == null
                    ? const Center(child: CircularProgressIndicator())
                    : GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: LatLng(_currentPosition!.latitude,
                              _currentPosition!.longitude),
                          zoom: 15,
                        ),
                        onMapCreated: (c) => _mapController = c,
                        myLocationEnabled: true,
                        myLocationButtonEnabled: false,
                        zoomControlsEnabled: false,
                        style: _darkMapStyle,
                      ),
                Positioned(
                  bottom: 24,
                  right: 24,
                  child: Column(
                    children: [
                      _buildMapFab(LucideIcons.layers, () {}),
                      const SizedBox(height: 12),
                      _buildMapFab(LucideIcons.navigation,
                          _getCurrentLocation,
                          isPrimary: true),
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

  Widget _buildMapFab(IconData icon, VoidCallback onPressed,
      {bool isPrimary = false}) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: isPrimary
              ? const Color(0xFF3B82F6)
              : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
          border: Border.all(
              color: isPrimary
                  ? Colors.transparent
                  : Colors.white.withValues(alpha: 0.05)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildProfileScreen() {
    final user = FirebaseAuth.instance.currentUser;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (user?.photoURL != null)
            CircleAvatar(
              radius: 40,
              backgroundImage: NetworkImage(user!.photoURL!),
            ),
          const SizedBox(height: 16),
          Text(
            user?.displayName ?? 'Field Responder',
            style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            user?.email ?? '',
            style: TextStyle(
                color: Colors.blueGrey.shade400, fontSize: 13),
          ),
        ],
      ),
    );
  }

  final String? _darkMapStyle = null;
}