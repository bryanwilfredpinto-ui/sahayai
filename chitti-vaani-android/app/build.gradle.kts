plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace  = "in.sahayai.chitti.vaani"
    compileSdk = 34

    defaultConfig {
        applicationId = "in.sahayai.chitti.vaani"
        minSdk        = 26   // Android 8.0+ — covers ~92% of Indian devices (StatCounter Q1 2026)
        targetSdk     = 34
        versionCode   = 1
        versionName   = "1.0.0"
    }

    // ── Release signing config ──
    //
    // Reads from env vars (preferred — set them on the build machine,
    // never in this repo) OR from $rootProject/keystore.properties
    // (also gitignored). If neither is present the release signingConfig
    // is left unset and gradle falls back to the default debug key —
    // useful for local "does it compile" checks, but the resulting APK
    // is NOT shippable. See BUILD_APK_RUNBOOK.md at repo root.
    //
    // Required env vars on the build machine:
    //   CHITTI_KEYSTORE_PATH  — absolute path to the .jks (kept OUTSIDE the repo)
    //   CHITTI_KEYSTORE_PASS  — store password
    //   CHITTI_KEY_ALIAS      — key alias (default "chitti")
    //   CHITTI_KEY_PASS       — key password (often same as KEYSTORE_PASS)
    val ksPath  = System.getenv("CHITTI_KEYSTORE_PATH") ?: ""
    val ksPass  = System.getenv("CHITTI_KEYSTORE_PASS") ?: ""
    val keyAls  = System.getenv("CHITTI_KEY_ALIAS") ?: "chitti"
    val keyPass = System.getenv("CHITTI_KEY_PASS") ?: ksPass

    if (ksPath.isNotEmpty() && ksPass.isNotEmpty()) {
        signingConfigs {
            create("release") {
                storeFile     = file(ksPath)
                storePassword = ksPass
                keyAlias      = keyAls
                keyPassword   = keyPass
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (ksPath.isNotEmpty() && ksPass.isNotEmpty()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-service:2.8.4")
    // WorkManager — drives ReminderWorker which fires
    // MainActivity.scheduleReminder("…", atIsoTime, "notification")
    // at the requested time. (Added 2026-05-22.)
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    // On-device speech recognition for emergency keyword spotting
    // (Vosk wraps Kaldi; small offline models per language)
    // Drop the .aar into app/libs/ when wiring Vosk; the dependency is
    // declared here for the Phase-2.4 milestone.
    // implementation("com.alphacephei:vosk-android:0.3.47@aar")
}
