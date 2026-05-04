#!/usr/bin/env bash
set -euo pipefail

# Stable Fold wireless ADB installer.
# Prefer the phone's Tailscale IP so local Wi-Fi DHCP changes do not matter.
# Override with: FOLD_ADB_HOST=host:port scripts/install-fold.sh

TARGET="${FOLD_ADB_HOST:-100.88.253.107:5555}"
PACKAGE="${ANDROID_PACKAGE:-studio.aops.mindmapp}"
APK="${APK_PATH:-android/app/build/outputs/apk/debug/app-debug.apk}"
SKIP_BUILD="${SKIP_BUILD:-0}"
LAUNCH="${LAUNCH:-1}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Set ANDROID_HOME or add platform-tools to PATH." >&2
  exit 1
fi

if [[ "$SKIP_BUILD" != "1" ]]; then
  JAVA_HOME="${JAVA_HOME:-/home/linuxbrew/.linuxbrew/opt/openjdk@21}" ANDROID_HOME="$ANDROID_HOME" npm run android:debug
fi

echo "Connecting to Fold over wireless ADB: $TARGET"
adb connect "$TARGET" >/dev/null
adb -s "$TARGET" wait-for-device

echo "Installing $APK"
adb -s "$TARGET" install -r "$APK"

if [[ "$LAUNCH" == "1" ]]; then
  adb -s "$TARGET" shell am force-stop "$PACKAGE" || true
  adb -s "$TARGET" shell monkey -p "$PACKAGE" 1 >/dev/null
  echo "Launched $PACKAGE on $TARGET"
fi
