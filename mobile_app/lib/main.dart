import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:mobile_app/screens/dashboard_screen.dart';
import 'package:mobile_app/screens/login_screen.dart';
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
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Slate-900 like web
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3B82F6), // Blue-500
          brightness: Brightness.dark,
          surface: const Color(0xFF1E293B), // Slate-800
        ),
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          backgroundColor: Color(0xFF0F172A),
          elevation: 0,
          titleTextStyle: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            letterSpacing: 2.0,
            color: Colors.white,
          ),
        ),
        cardTheme: CardTheme(
          color: const Color(0xFF1E293B),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: Color(0xFF334155), width: 1), // Slate-700
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF3B82F6),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            textStyle: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
