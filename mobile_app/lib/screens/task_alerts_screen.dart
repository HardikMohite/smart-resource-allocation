import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:mobile_app/main.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:lucide_icons_flutter/lucide_icons_flutter.dart';
import 'dart:developer' as developer;

class TaskAlertsScreen extends StatelessWidget {
  const TaskAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    User? user;
    if (isFirebaseInitialized) {
      try {
        user = FirebaseAuth.instance.currentUser;
      } catch (e) {
        developer.log('Firebase Auth not available in Demo Mode');
      }
    }
    
    return Scaffold(
      backgroundColor: Colors.transparent, // Hosted in Dashboard
      body: user == null 
        ? _buildEmptyState('LOGIN REQUIRED', LucideIcons.lock)
        : StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('tasks')
                .where('assigned_volunteer_uid', isEqualTo: user.uid)
                .where('status', isEqualTo: 'assigned')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)));
              }

              final tasks = snapshot.data?.docs ?? [];

              if (tasks.isEmpty) {
                return _buildEmptyState('NO ACTIVE DISPATCHES', LucideIcons.checkCircle);
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                itemCount: tasks.length,
                itemBuilder: (context, index) {
                  final task = tasks[index].data() as Map<String, dynamic>;
                  final taskId = tasks[index].id;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header with Severity
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.02),
                            border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
                                ),
                                child: Text(
                                  'LVL ${task['severity_score']}',
                                  style: const TextStyle(color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.black, letterSpacing: 1.0),
                                ),
                              ),
                              const Icon(LucideIcons.moreHorizontal, size: 18, color: Colors.slate),
                            ],
                          ),
                        ),

                        Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                task['title']?.toString().toUpperCase() ?? 'UNTITLED OPERATION',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                task['description'] ?? 'No description provided.',
                                style: TextStyle(color: Colors.slate.shade400, fontSize: 13, height: 1.5),
                              ),
                              const SizedBox(height: 32),
                              
                              // Action Row
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () async {
                                        final lat = task['latitude'];
                                        final lng = task['longitude'];
                                        final url = 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
                                        if (await canLaunchUrl(Uri.parse(url))) {
                                          await launchUrl(Uri.parse(url));
                                        }
                                      },
                                      icon: const Icon(LucideIcons.navigation, size: 16),
                                      label: const Text('NAVIGATE', style: TextStyle(letterSpacing: 1.2)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF3B82F6),
                                        padding: const EdgeInsets.symmetric(vertical: 18),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                                    ),
                                    child: IconButton(
                                      onPressed: () async {
                                        await FirebaseFirestore.instance
                                            .collection('tasks')
                                            .doc(taskId)
                                            .update({'status': 'resolved'});
                                      },
                                      icon: const Icon(LucideIcons.checkCircle, color: Color(0xFF10B981), size: 24),
                                      padding: const EdgeInsets.all(14),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
    );
  }

  Widget _buildEmptyState(String title, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.02),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Icon(icon, size: 48, color: Colors.slate.shade600),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.0,
              color: Colors.slate.shade500,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Operations are running normally.',
            style: TextStyle(fontSize: 11, color: Colors.slate),
          ),
        ],
      ),
    );
  }
}
