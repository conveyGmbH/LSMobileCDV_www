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

### Environment variables
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
cordova platform add android@14.0.1
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

### JDK version sensitivity
The Android build will fail with `Unsupported class file major version` if you use JDK 25 or higher. Stick to JDK 21.

### Pinned Android Version
Android Version 15+ seem to introduce new Problems (e.g. different file serving, causing CORS Errors) - Stick to 14.0.1