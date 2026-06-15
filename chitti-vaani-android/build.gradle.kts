// Top-level build file. Per-module configuration lives in app/build.gradle.kts.
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    // KSP — Room annotation processor (generates VaaniDatabase_Impl). Version
    // is pinned to the Kotlin version (1.9.24) per KSP's lockstep contract.
    id("com.google.devtools.ksp") version "1.9.24-1.0.20" apply false
}
