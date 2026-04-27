# LSMobile - LeadSuccess Mobile App

Cordova-based mobile app for the LeadSuccess lead management platform. Targets iOS and Android, Windows / Electron port unfinished.

**Note:** The `platforms/` and `plugins/` folders are generated automatically and are gitignored. Never edit them directly.

**Note:** DO NOT switch to this branch from a branch that tracks only the www (content) directory - Switching back will introduce residual files and contamination of the other branch. Instead, do a fresh clone of this branch.

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
- **Gradle** - install standalone from [gradle.org/releases](https://gradle.org/releases)
  - Bundled (with android Studio) Gradle did not work for me

### Environment variables
Environment Variables are necessary for the build tools to find your installation(s) - If a build step says something "is not found" or "is not recognized", this is usually why.

- **JAVA_HOME**: Points to your JDK installation
 - Windows default: `C:\Program Files\Java\jdk-21`
 - MacOS default: Homebrew install: `/opt/homebrew/opt/openjdk@21/`

- **ANDROID_HOME**: Points to your Android SDK Installation
 - Windows default: `C:\Users\<you>\AppData\Local\Android\Sdk`
 - MacOS default: `~/Library/Android/sdk`

- **PATH**: Make sure these are in your PATH
 `%ANDROID_HOME%\platform-tools` (Windows) / `$ANDROID_HOME/platform-tools` (Mac)  
 Your standalone Gradle `bin` folder (wherever you extracted it)

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/conveyGmbH/LSMobileCDV_www
cd LSMobileCDV_www

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

### Android Build fails with "No installed build-tools found"
Make sure you have the correct Version of the build-tools installed; On Android Studio Panda 3 this requires the extra "Show package details" checkmark