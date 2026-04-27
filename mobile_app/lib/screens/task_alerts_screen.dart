import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:mobile_app/main.dart';
import 'package:url_launcher/url_launcher.dart';

class TaskAlertsScreen extends StatelessWidget {
  const TaskAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    User? user;
    if (isFirebaseInitialized) {
      try {
        user = FirebaseAuth.instance.currentUser;
      } catch (e) {
        print('Firebase Auth not available in Demo Mode');
      }
    }
    
    return Scaffold(
      appBar: AppBar(title: const Text('My Assignments')),
      body: user == null 
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 64, color: Colors.blueGrey.shade200),
                const SizedBox(height: 16),
                const Text('Login required for assignments', style: TextStyle(color: Colors.blueGrey)),
                const Text('(Running in Demo Mode)', style: TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          )
        : StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('tasks')
                .where('assigned_volunteer_uid', '==', user.uid)
                .where('status', '==', 'assigned')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              final tasks = snapshot.data?.docs ?? [];

              if (tasks.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_turned_in_outlined, size: 64, color: Colors.blueGrey.shade200),
                      const SizedBox(height: 16),
                      const Text('No active assignments', style: TextStyle(color: Colors.blueGrey)),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: tasks.length,
                itemBuilder: (context, index) {
                  final task = tasks[index].data() as Map<String, dynamic>;
                  final taskId = tasks[index].id;

                  return Card(
                    margin: const EdgeInsets.bottom(16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 4,
                    shadowColor: Colors.black12,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  task['title'] ?? 'Untitled Task',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ),
                              Chip(
                                label: Text('Lvl ${task['severity_score']}'),
                                backgroundColor: Colors.red.shade50,
                                labelStyle: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(task['description'] ?? '', style: TextStyle(color: Colors.blueGrey.shade600)),
                          const Divider(height: 32),
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
                                  icon: const Icon(Icons.navigation),
                                  label: const Text('Navigate'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () async {
                                    await FirebaseFirestore.instance
                                        .collection('tasks')
                                        .doc(taskId)
                                        .update({'status': 'resolved'});
                                  },
                                  icon: const Icon(Icons.check),
                                  label: const Text('Resolve'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
    );
  }
}
