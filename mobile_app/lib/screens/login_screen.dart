import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:lucide_icons/lucide_icons.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = false;

  late final TabController _tabController;

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isRegistering = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // ── Human-readable error messages (covers token expiry/revocation) ────────
  String _friendlyError(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No account found with this email.';
      case 'wrong-password':
      case 'invalid-credential':
        return 'Incorrect email or password.';
      case 'email-already-in-use':
        return 'An account with this email already exists.';
      case 'weak-password':
        return 'Password must be at least 6 characters with at least one letter and one number.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'user-token-expired':
      case 'id-token-expired':
      case 'session-cookie-expired':
        return 'Your session has expired. Please sign in again.';
      case 'user-token-revoked':
      case 'id-token-revoked':
      case 'session-cookie-revoked':
        return 'Your session was revoked. Please sign in again.';
      case 'network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return e.message ?? 'Authentication failed. Please try again.';
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(LucideIcons.alertCircle, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(20),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  Future<void> _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    try {
      if (kIsWeb) {
        await FirebaseAuth.instance.signInWithPopup(GoogleAuthProvider());
        // Google accounts are always pre-verified, but reload to get a fresh
        // token so user.emailVerified is accurate from the StreamBuilder.
        await FirebaseAuth.instance.currentUser?.reload();
      } else {
        final googleUser = await GoogleSignIn().signIn();
        if (googleUser == null) return;
        final googleAuth = await googleUser.authentication;
        final credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        await FirebaseAuth.instance.signInWithCredential(credential);
        // Reload to ensure the user object reflects the latest server state.
        await FirebaseAuth.instance.currentUser?.reload();
      }
    } on FirebaseAuthException catch (e) {
      _showError(_friendlyError(e));
    } catch (_) {
      _showError('Unexpected error. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Email / Password ──────────────────────────────────────────────────────
  Future<void> _handleEmailLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;
      if (_isRegistering) {
        final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
            email: email, password: password);
        // Send verification email immediately after account creation.
        await cred.user?.sendEmailVerification();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(LucideIcons.mail, color: Colors.white, size: 18),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Verification email sent — please check your inbox before signing in.',
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF3B82F6),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(20),
            duration: const Duration(seconds: 6),
          ),
        );
        // Sign out immediately so the user must verify before accessing the dashboard.
        await FirebaseAuth.instance.signOut();
      } else {
        await FirebaseAuth.instance.signInWithEmailAndPassword(
            email: email, password: password);
        // Guard: reject unverified email/password sign-ins.
        final user = FirebaseAuth.instance.currentUser;
        if (user != null && !user.emailVerified) {
          await FirebaseAuth.instance.signOut();
          if (!mounted) return;
          // Offer a resend option in-line so the user isn't stuck.
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text(
                'Please verify your email before signing in.',
              ),
              backgroundColor: const Color(0xFFEF4444),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.all(20),
              duration: const Duration(seconds: 8),
              action: SnackBarAction(
                label: 'Resend',
                textColor: Colors.white,
                onPressed: () async {
                  try {
                    // Re-authenticate temporarily to resend the email.
                    final tempCred = await FirebaseAuth.instance
                        .signInWithEmailAndPassword(
                          email: _emailController.text.trim(),
                          password: _passwordController.text,
                        );
                    await tempCred.user?.sendEmailVerification();
                    await FirebaseAuth.instance.signOut();
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Verification email resent. Check your inbox.'),
                        backgroundColor: const Color(0xFF3B82F6),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        margin: const EdgeInsets.all(20),
                      ),
                    );
                  } catch (_) {
                    // Silently ignore — user can retry manually.
                  }
                },
              ),
            ),
          );
        }
      }
    } on FirebaseAuthException catch (e) {
      _showError(_friendlyError(e));
    } catch (_) {
      _showError('Unexpected error. Please try again.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showError('Enter your email above before requesting a reset.');
      return;
    }
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      // Swallow user-not-found and invalid-email silently — showing a
      // different message for known vs unknown addresses leaks whether an
      // account exists (email enumeration). Always show the same success
      // message regardless. Only surface genuine transient errors.
      if (e.code != 'user-not-found' && e.code != 'invalid-email') {
        _showError(_friendlyError(e));
        return;
      }
    }
    // Always show success so attackers can't enumerate registered emails.
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'If an account exists for that email, a reset link has been sent.',
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(
            top: -150, left: -50,
            child: Container(
              width: 400, height: 400,
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  const SizedBox(height: 60),
                  // Logo
                  TweenAnimationBuilder(
                    tween: Tween<double>(begin: 0, end: 1),
                    duration: const Duration(milliseconds: 800),
                    builder: (context, value, child) => Transform.scale(
                      scale: value, child: Opacity(opacity: value, child: child)),
                    child: Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(40),
                        border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
                        boxShadow: [BoxShadow(color: Colors.blue.withValues(alpha: 0.1), blurRadius: 40, spreadRadius: 10)],
                      ),
                      child: const Icon(LucideIcons.shield, size: 56, color: Color(0xFF3B82F6)),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text('NGO ADMIN PORTAL',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                  const SizedBox(height: 8),
                  Text('Unified Command & Coordination System',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 40),

                  // Tab bar
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      indicator: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        borderRadius: BorderRadius.circular(13),
                      ),
                      indicatorSize: TabBarIndicatorSize.tab,
                      dividerColor: Colors.transparent,
                      labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.0),
                      unselectedLabelStyle: const TextStyle(fontSize: 12),
                      tabs: const [Tab(text: 'GOOGLE'), Tab(text: 'EMAIL')],
                    ),
                  ),
                  const SizedBox(height: 28),

                  SizedBox(
                    height: 310,
                    child: TabBarView(
                      controller: _tabController,
                      children: [_buildGoogleTab(), _buildEmailTab()],
                    ),
                  ),

                  const SizedBox(height: 32),
                  Opacity(
                    opacity: 0.4,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(LucideIcons.gavel, size: 12),
                        SizedBox(width: 10),
                        Text('ENCRYPTED PRODUCTION GATEWAY',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2.0)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoogleTab() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Sign in with your Google account to access\nthe command centre.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.blueGrey.shade400, fontSize: 13, height: 1.6),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleGoogleLogin,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF0F172A),
            minimumSize: const Size(double.infinity, 64),
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          child: _isLoading
              ? const SizedBox(width: 24, height: 24,
                  child: CircularProgressIndicator(strokeWidth: 3, color: Color(0xFF0F172A)))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.network(
                      'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                      height: 22,
                      errorBuilder: (_, __, ___) =>
                          const Icon(LucideIcons.mail, size: 22, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(width: 14),
                    const Text('Continue with Google',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _buildEmailTab() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: _inputDecoration('Email address', LucideIcons.mail),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
              if (!emailRegex.hasMatch(v.trim())) return 'Enter a valid email address';
              return null;
            },
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            decoration: _inputDecoration('Password', LucideIcons.lock,
              suffix: IconButton(
                icon: Icon(_obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                    size: 18, color: Colors.blueGrey),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Password is required';
              if (_isRegistering) {
                if (v.length < 6) return 'At least 6 characters required';
                if (!v.contains(RegExp(r'[A-Za-z]'))) {
                  return 'Must contain at least one letter';
                }
                if (!v.contains(RegExp(r'[0-9]'))) {
                  return 'Must contain at least one number';
                }
              }
              return null;
            },
          ),
          if (!_isRegistering)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _handleForgotPassword,
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 4)),
                child: Text('Forgot password?',
                    style: TextStyle(color: Colors.blueGrey.shade400, fontSize: 12)),
              ),
            )
          else
            const SizedBox(height: 8),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleEmailLogin,
              child: _isLoading
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white))
                  : Text(_isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN',
                      style: const TextStyle(letterSpacing: 1.2)),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: () => setState(() {
                _isRegistering = !_isRegistering;
                _formKey.currentState?.reset();
              }),
              child: Text(
                _isRegistering
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Register",
                style: TextStyle(color: Colors.blueGrey.shade400, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon, {Widget? suffix}) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.blueGrey.shade500, fontSize: 13),
      prefixIcon: Icon(icon, size: 18, color: Colors.blueGrey.shade500),
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFF1E293B),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08))),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08))),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 1.5)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFEF4444))),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }
}