import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

// ── Read secrets from local.properties (never committed to VCS) ──────────────
// In CI, set MAPS_API_KEY as an environment variable instead of local.properties.
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun secret(key: String): String =
    System.getenv(key) ?: localProps.getProperty(key)
    ?: error("Missing secret '$key'. Add it to local.properties or as a CI env var.")
// ─────────────────────────────────────────────────────────────────────────────

android {
    namespace = "com.example.mobile_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.googlechallenge.smartresource"
        minSdk = 21
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // Inject the Maps key into AndroidManifest.xml at build time.
        // Add  MAPS_API_KEY=AIzaSy...  to android/local.properties (gitignored).
        manifestPlaceholders["MAPS_API_KEY"] = secret("MAPS_API_KEY")
    }

    buildTypes {
        release {
            // TODO: Replace debug signing with a proper release keystore.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}