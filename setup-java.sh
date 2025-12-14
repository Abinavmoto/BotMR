#!/bin/bash
# Setup Java 17 for Android builds

JAVA_17_PATH="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk"
SYSTEM_JAVA_PATH="/Library/Java/JavaVirtualMachines/openjdk-17.jdk"

if [ -d "$JAVA_17_PATH" ]; then
  echo "✅ Java 17 found at: $JAVA_17_PATH"
  
  # Link Java 17 to system location (required for macOS)
  echo "Linking Java 17 to system location..."
  sudo ln -sfn "$JAVA_17_PATH" "$SYSTEM_JAVA_PATH"
  
  # Set JAVA_HOME
  export JAVA_HOME="$JAVA_17_PATH"
  export PATH="$JAVA_HOME/bin:$PATH"
  
  echo "✅ Java 17 configured"
  echo ""
  echo "Verifying Java version:"
  /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home/bin/java -version
  
  echo ""
  echo "📝 To make this permanent, add to ~/.zshrc:"
  echo "export JAVA_HOME=\"$JAVA_17_PATH\""
  echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\""
  echo ""
  echo "Then run: source ~/.zshrc"
else
  echo "❌ Java 17 not found. Installing..."
  echo "Run: brew install openjdk@17"
fi
