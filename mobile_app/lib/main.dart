import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:mobile_app/screens/dashboard_screen.dart';
import 'dart:developer' as developer;

bool isFirebaseInitialized = false;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // Attempt to initialize Firebase (will fail if options are missing)
    await Firebase.initializeApp();
    isFirebaseInitialized = true;
    developer.log('Firebase initialized successfully');
  } catch (e) {
    developer.log('Running in Demo Mode: Firebase not initialized ($e)');
  }
  
  runApp(const SmartResourceApp());
}

class SmartResourceApp extends StatelessWidget {
  const SmartResourceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Resource Volunteer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E88E5),
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          backgroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const DashboardScreen(),
    );
  }
}
