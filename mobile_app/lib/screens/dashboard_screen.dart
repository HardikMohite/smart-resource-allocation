import 'package:flutter/material.dart';
import 'package:mobile_app/main.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
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
        content: Text(value ? 'You are now ON DUTY' : 'You are now OFF DUTY'),
        backgroundColor: value ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'VOLUNTEER DASHBOARD',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          // Duty Toggle Section
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Card(
              elevation: 0,
              color: _isAvailable ? Colors.green.shade50 : Colors.blueGrey.shade50,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: _isAvailable ? Colors.green.shade200 : Colors.blueGrey.shade200,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isAvailable ? 'ON DUTY' : 'OFF DUTY',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: _isAvailable ? Colors.green.shade700 : Colors.blueGrey.shade700,
                          ),
                        ),
                        Text(
                          _isAvailable ? 'Awaiting assignments...' : 'Go on duty to receive tasks',
                          style: TextStyle(fontSize: 12, color: Colors.blueGrey.shade500),
                        ),
                      ],
                    ),
                    Switch.adaptive(
                      value: _isAvailable,
                      onChanged: _toggleDuty,
                      activeThumbColor: Colors.green,
                      activeTrackColor: Colors.green.withValues(alpha: 0.5),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Map Section
          Expanded(
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
                      ),
                
                // Floating Action Buttons
                Positioned(
                  bottom: 20,
                  right: 20,
                  child: FloatingActionButton(
                    onPressed: _getCurrentLocation,
                    backgroundColor: Colors.white,
                    child: const Icon(Icons.my_location, color: Colors.blue),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: Colors.blue.shade700,
        unselectedItemColor: Colors.blueGrey.shade400,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Status'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
