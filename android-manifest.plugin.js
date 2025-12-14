const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Config plugin to add foreground service permissions and service declaration
 * to AndroidManifest.xml for background audio recording.
 */
const withAndroidForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Ensure application element exists
    if (!manifest.application) {
      manifest.application = [{}];
    }
    const application = manifest.application[0];

    // Add service declaration for foreground service
    if (!application.service) {
      application.service = [];
    }

    // Check if Notifee's foreground service already exists
    // Notifee provides its own service class: app.notifee.core.ForegroundService
    const hasNotifeeService = application.service?.some(
      (service) => service.$?.['android:name'] === 'app.notifee.core.ForegroundService'
    );

    if (!hasNotifeeService) {
      // Add Notifee's built-in foreground service
      if (!application.service) {
        application.service = [];
      }
      application.service.push({
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'microphone',
        },
      });
    }

    // Ensure permissions are in manifest
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = manifest['uses-permission'];
    const permissionNames = permissions.map((p) => p.$?.['android:name']);

    // Add FOREGROUND_SERVICE if not present
    if (!permissionNames.includes('android.permission.FOREGROUND_SERVICE')) {
      permissions.push({
        $: { 'android:name': 'android.permission.FOREGROUND_SERVICE' },
      });
    }

    // Add FOREGROUND_SERVICE_MICROPHONE for Android 14+
    if (!permissionNames.includes('android.permission.FOREGROUND_SERVICE_MICROPHONE')) {
      permissions.push({
        $: { 'android:name': 'android.permission.FOREGROUND_SERVICE_MICROPHONE' },
      });
    }

    return config;
  });
};

module.exports = withAndroidForegroundService;
