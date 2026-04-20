# LSMobile - LeadSuccess Mobile App

Cordova-based mobile app for the LeadSuccess lead management platform. Targets iOS and Android. (And Windows-app?)

**Note:** The `platforms/` and `plugins/` folders are generated automatically and are gitignored. Never edit them directly.

## Prerequisites

### All platforms
- **Node.js** - v18 or higher recommended
- **Cordova CLI** - install globally: `npm install -g cordova`
- **JDK 21** - testing with JDK 25 ran into a gradle related error...

### iOS (Mac only)
- **Xcode** - latest stable version
- **Xcode Command Line Tools** - `xcode-select --install`
- **Xcode iOS files** - Xcode > Settings > Components > iOS X > Get

### Android (Mac or Windows)
- **Android Studio** - 
  - During setup, install: Android SDK, Android SDK Platform-Tools, Android SDK Command-line Tools
  - Install at least one Android platform (API 34 / Android 14 recommended)
- **Gradle** - install standalone from [gradle.org/releases](https://gradle.org/releases)
  - Bundled (with android Studio) Gradle did not work for me

### Windows-specific environment variables
After installing the above, there might be environment variables that need adjustment or need to be added (e.g. JAVA_HOME, ANDROID_HOME, PATH)

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/conveyGmbH/LSMobileCDV_www
cd LSMobile_www

# 2. Install dependencies
npm install

# 3. Add platforms (not stored in git)
cordova platform add ios      # Mac only
cordova platform add android
```

## Running the App

```bash
# iOS (Mac only, opens in Xcode simulator or device)
cordova run ios

# Android (requires connected device or running emulator)
cordova run android

# Build only, without deploying
cordova build android
cordova build ios
```

## Known Issues

### Android emulator CORS error
When running in the Android emulator, login requests will fail with a CORS error. The emulator serves the app from `https://localhost`, which the backend server does not allow. This is an emulator-only issue — the app works correctly on real devices. Fix requires adding `Access-Control-Allow-Origin: https://localhost` to the response headers on the backend.

### JDK version sensitivity
The Android build will fail with `Unsupported class file major version` if you use JDK 25 or higher. Stick to JDK 21.

