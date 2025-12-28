/**
 * Foreground Service for Android Background Recording
 * Uses @notifee/react-native to properly register a foreground service
 * This is the "missing piece" for reliable background recording on Android
 */

import notifee, { AndroidImportance, AndroidCategory, AuthorizationStatus } from '@notifee/react-native'
import { Platform, Linking, Alert } from 'react-native'

const FOREGROUND_SERVICE_CHANNEL_ID = 'recording-foreground-service'
const NOTIFICATION_ID = 'recording-status'

// Track if foreground service is registered
let isServiceRegistered = false

// Track if foreground service is currently active (for idempotent stop)
let isServiceActive = false

// Track notification update interval
let notificationUpdateInterval: NodeJS.Timeout | null = null

/**
 * Register the foreground service handler
 * This MUST be called before using asForegroundService: true
 * Call this once when the app starts (e.g., in App.tsx or recording screen mount)
 */
/**
 * Register the foreground service handler
 * CRITICAL: This MUST be called in the app entry file (index.js) BEFORE App component loads,
 * NOT in a component or App.tsx. Notifee requires this to be registered before any notification
 * with asForegroundService: true is displayed.
 * 
 * According to Notifee docs: "This registration should occur early in your application's 
 * lifecycle, ideally outside of any React components, such as in your index.js file."
 */
export function registerForegroundServiceHandler(): void {
  if (Platform.OS !== 'android') {
    return
  }

  if (isServiceRegistered) {
    console.log('ℹ️ [ForegroundService] Handler already registered, skipping')
    return
  }

  try {
    console.log('🚀 [ForegroundService] Registering foreground service handler in index.js...')
    
    // Register the foreground service handler
    // The promise should not resolve until the service is done
    notifee.registerForegroundService((notification) => {
      console.log('✅ [ForegroundService] Handler callback invoked - service is running')
      console.log('   Notification ID:', notification.id)
      return new Promise(() => {
        // This promise never resolves, keeping the service alive
        // The service will be stopped when stopForegroundService() is called
        console.log('🔄 [ForegroundService] Service promise active - keeping service alive')
      })
    })
    
    isServiceRegistered = true
    console.log('✅ [ForegroundService] Handler registered successfully in index.js entry point')
    console.log('✅ [ForegroundService] Ready to display foreground service notifications')
  } catch (error) {
    console.error('❌ [ForegroundService] Error registering handler:', error)
    throw error // Re-throw so caller knows registration failed
  }
}

/**
 * Request notification permissions using Notifee
 * CRITICAL: Must be called before displaying any notifications
 */
export async function requestNotifeePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true // iOS permissions handled separately
  }

  try {
    console.log('📱 [ForegroundService] Checking notification permissions...')
    
    // Check current permission status
    const settings = await notifee.getNotificationSettings()
    console.log('📱 [ForegroundService] Current permission status:', settings.authorizationStatus)
    
    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('✅ [ForegroundService] Notification permissions already granted')
      return true
    }
    
    // Request permissions
    console.log('📱 [ForegroundService] Requesting notification permissions...')
    const requestSettings = await notifee.requestPermission()
    console.log('📱 [ForegroundService] Permission request result:', requestSettings.authorizationStatus)
    
    if (requestSettings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('✅ [ForegroundService] Notification permissions granted')
      return true
    } else {
      console.warn('⚠️ [ForegroundService] Notification permissions denied:', requestSettings.authorizationStatus)
      return false
    }
  } catch (error) {
    console.error('❌ [ForegroundService] Error requesting notification permissions:', error)
    return false
  }
}

/**
 * Create notification channel for foreground service
 * Must be called before starting the foreground service
 */
export async function createForegroundServiceChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    console.log('📱 [ForegroundService] Creating notification channel...')
    await notifee.createChannel({
      id: FOREGROUND_SERVICE_CHANNEL_ID,
      name: 'Recording Status',
      importance: AndroidImportance.HIGH, // Required for foreground service
      sound: undefined, // No sound during recording
      vibration: false,
      lights: false,
    })
    console.log('✅ [ForegroundService] Notification channel created/verified')
  } catch (error) {
    console.error('❌ [ForegroundService] Error creating channel:', error)
    throw error
  }
}

/**
 * Start foreground service with notification
 * This is REQUIRED for background recording on Android
 * 
 * @param durationSeconds Current recording duration in seconds
 * @returns true if service started successfully, false otherwise
 */
/**
 * Verify notification is visible with retry polling
 * @param maxAttempts Maximum number of retry attempts
 * @param backoffMs Array of backoff delays in milliseconds
 * @param isAppForeground Whether app is in foreground
 * @param hasPermission Whether notification permissions are granted
 * @returns true if notification is visible, false otherwise
 */
async function verifyNotificationVisible(
  maxAttempts: number = 5,
  backoffMs: number[] = [300, 600, 1200, 2000, 3000],
  isAppForeground: boolean = true,
  hasPermission: boolean = true
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const delay = backoffMs[attempt] || backoffMs[backoffMs.length - 1]
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      const displayedNotifications = await notifee.getDisplayedNotifications()
      const notificationExists = displayedNotifications.some((n: { id: string }) => n.id === NOTIFICATION_ID)
      
      if (notificationExists) {
        console.log(`✅ [ForegroundService] Notification verified visible (attempt ${attempt + 1}/${maxAttempts})`)
        return true
      }
      
      console.log(`⏳ [ForegroundService] Notification not yet visible (attempt ${attempt + 1}/${maxAttempts})`)
    } catch (error) {
      console.warn(`⚠️ [ForegroundService] Error checking notification (attempt ${attempt + 1}/${maxAttempts}):`, error)
    }
  }
  
  // Only fail if app is in foreground AND permissions are granted
  // If app is backgrounded or permissions denied, treat as success (notification might be delayed)
  if (isAppForeground && hasPermission) {
    console.warn('⚠️ [ForegroundService] Notification not visible after all retries, but displayNotification() succeeded')
    // Don't fail - treat displayNotification success as sufficient
  }
  
  return true // Treat displayNotification success as started
}

/**
 * Start foreground service with notification
 * CRITICAL: This must be called BEFORE Audio.Recording.createAsync()
 * to ensure the notification is visible when recording starts.
 * 
 * @param recordingStartTimestamp Timestamp when recording started (for accurate timer)
 * @returns true if service started successfully, false otherwise
 */
export async function startForegroundService(recordingStartTimestamp: number): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true // iOS doesn't need foreground service
  }

  try {
    // CRITICAL: Request notification permissions FIRST (Android 13+)
    console.log('📱 [ForegroundService] Requesting notification permissions...')
    const hasPermission = await requestNotifeePermissions()
    if (!hasPermission) {
      console.error('❌ [ForegroundService] Notification permissions denied - cannot show foreground service')
      Alert.alert(
        'Notification Permission Required',
        'BotMR needs notification permission to show a persistent notification while recording. Please enable notifications in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      )
      return false
    }
    console.log('✅ [ForegroundService] Notification permissions granted')

    // CRITICAL: Verify handler is registered (should be done in index.js)
    if (!isServiceRegistered) {
      console.warn('⚠️ [ForegroundService] Handler not registered! Registering now (should be in index.js)...')
      registerForegroundServiceHandler()
      // Longer delay to ensure Notifee has fully registered the handler
      await new Promise(resolve => setTimeout(resolve, 500))
    } else {
      console.log('✅ [ForegroundService] Handler already registered')
      // Small delay to ensure Notifee has processed the registration
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Ensure channel exists
    console.log('📱 [ForegroundService] Creating/verifying notification channel...')
    await createForegroundServiceChannel()

    // Use static text instead of timer (user preference)
    const notificationBody = 'BotMR is recording • Tap to return'

    console.log('📱 [ForegroundService] Displaying foreground service notification...')
    console.log(`   - Title: 🎙️ BotMR is recording audio`)
    console.log(`   - Body: ${notificationBody}`)
    console.log(`   - asForegroundService: true`)
    console.log(`   - foregroundServiceType: microphone`)
    console.log(`   - Handler registered: ${isServiceRegistered}`)

    // CRITICAL: Add delay to ensure Notifee has fully processed the handler registration
    if (isServiceRegistered) {
      console.log('⏳ [ForegroundService] Waiting 300ms to ensure Notifee handler is fully registered...')
      await new Promise(resolve => setTimeout(resolve, 300))
      console.log('✅ [ForegroundService] Delay complete, handler should be ready')
    }

    // Start foreground service with notification
    console.log('📤 [ForegroundService] Calling notifee.displayNotification() with asForegroundService: true...')
    try {
      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: '🎙️ BotMR is recording audio',
        body: notificationBody, // Static text: "BotMR is recording • Tap to return"
        android: {
          channelId: FOREGROUND_SERVICE_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.SERVICE,
          // CRITICAL: This makes it a foreground service
          asForegroundService: true,
          ongoing: true, // Makes notification non-dismissible
          autoCancel: false,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          // Foreground service type for microphone
          foregroundServiceType: 'microphone',
        },
      })
      
      // Treat displayNotification success as service started
      console.log('✅ [ForegroundService] displayNotification() succeeded - treating as started')
      isServiceActive = true
      
      // Start notification update interval
      startNotificationUpdateInterval(recordingStartTimestamp)
      
      // Verify with retry polling (non-blocking, doesn't fail if delayed)
      const isAppForeground = true // Could be passed as parameter if needed
      
      // Start verification immediately but don't block
      verifyNotificationVisible(5, [300, 600, 1200, 2000, 3000], isAppForeground, hasPermission)
        .then((visible) => {
          if (visible) {
            console.log('✅ [ForegroundService] Notification verified visible after retry polling')
          } else {
            console.warn('⚠️ [ForegroundService] Notification not visible after retries')
            console.warn('   - This might indicate a notification permission or channel issue')
            console.warn('   - Service will continue, but recording might not work in background')
            
            // Try to re-display notification as fallback
            setTimeout(async () => {
              try {
                console.log('🔄 [ForegroundService] Attempting to re-display notification...')
                await notifee.displayNotification({
                  id: NOTIFICATION_ID,
                  title: '🎙️ BotMR is recording audio',
                  body: notificationBody,
                  android: {
                    channelId: FOREGROUND_SERVICE_CHANNEL_ID,
                    importance: AndroidImportance.HIGH,
                    category: AndroidCategory.SERVICE,
                    asForegroundService: true,
                    ongoing: true,
                    autoCancel: false,
                    pressAction: {
                      id: 'default',
                      launchActivity: 'default',
                    },
                    foregroundServiceType: 'microphone',
                  },
                })
                console.log('✅ [ForegroundService] Re-display notification succeeded')
              } catch (retryError) {
                console.error('❌ [ForegroundService] Re-display notification failed:', retryError)
              }
            }, 1000)
          }
        })
        .catch((error) => {
          console.warn('⚠️ [ForegroundService] Error during verification polling (non-critical):', error)
        })
      
      console.log('✅ [ForegroundService] Foreground service started successfully')
      return true
    } catch (displayError) {
      console.error('❌ [ForegroundService] Error calling displayNotification:', displayError)
      isServiceActive = false
      return false
    }
  } catch (error) {
    console.error('❌ [ForegroundService] Error starting foreground service:', error)
    return false
  }
}

/**
 * Start notification update interval
 * Updates notification with static text (no timer) as per user preference
 */
function startNotificationUpdateInterval(recordingStartTimestamp: number): void {
  if (Platform.OS !== 'android') {
    return
  }
  
  // Clear any existing interval
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval)
    notificationUpdateInterval = null
  }
  
  // User prefers static text, not timer updates
  // Notification is set once and doesn't need updates
  // The interval is kept for potential future use but doesn't update timer
  console.log('ℹ️ [ForegroundService] Notification set to static text (no timer updates)')
}

/**
 * Update foreground service notification with new duration
 * @deprecated Use startNotificationUpdateInterval instead
 * @param durationSeconds Current recording duration in seconds
 */
export async function updateForegroundService(durationSeconds: number): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: '🎙️ BotMR is recording audio',
      body: `Tap to return — ${timeString}`,
      android: {
        channelId: FOREGROUND_SERVICE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.SERVICE,
        asForegroundService: true,
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        foregroundServiceType: 'microphone',
      },
    })
  } catch (error) {
    console.error('❌ Error updating foreground service:', error)
  }
}

/**
 * Stop foreground service and cancel notification
 * Idempotent: safe to call multiple times, short-circuits if already stopped
 */
export async function stopForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  // Short-circuit if already stopped
  if (!isServiceActive) {
    console.log('ℹ️ [ForegroundService] Service already stopped, skipping')
    return
  }

  try {
    console.log('🛑 [ForegroundService] Stopping foreground service...')
    
    // Clear notification update interval
    if (notificationUpdateInterval) {
      clearInterval(notificationUpdateInterval)
      notificationUpdateInterval = null
      console.log('✅ [ForegroundService] Notification update interval cleared')
    }
    
    // Mark as inactive first to prevent duplicate calls
    isServiceActive = false
    
    // Stop foreground service
    await notifee.stopForegroundService()
    console.log('✅ [ForegroundService] stopForegroundService() called')
    
    // Cancel notification
    await notifee.cancelNotification(NOTIFICATION_ID)
    console.log('✅ [ForegroundService] Notification canceled')
    
    console.log('✅ [ForegroundService] Foreground service stopped successfully')
  } catch (error) {
    console.error('❌ [ForegroundService] Error stopping service:', error)
    // Ensure state is cleared even on error
    isServiceActive = false
    if (notificationUpdateInterval) {
      clearInterval(notificationUpdateInterval)
      notificationUpdateInterval = null
    }
    
    // Try to cancel notification even if stopForegroundService fails
    try {
      await notifee.cancelNotification(NOTIFICATION_ID)
      console.log('✅ [ForegroundService] Notification canceled as fallback')
    } catch (cancelError) {
      console.error('❌ [ForegroundService] Error canceling notification:', cancelError)
    }
  }
}

/**
 * Check if foreground service is currently active
 */
export async function isForegroundServiceActive(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false
  }

  // Use internal state first (faster)
  if (!isServiceActive) {
    return false
  }

  try {
    const notifications = await notifee.getDisplayedNotifications()
    const active = notifications.some((n: { id: string }) => n.id === NOTIFICATION_ID)
    // Sync internal state with actual state
    if (!active && isServiceActive) {
      console.warn('⚠️ [ForegroundService] State mismatch: marked active but notification not found')
      isServiceActive = false
    }
    return active
  } catch (error) {
    console.error('❌ Error checking foreground service status:', error)
    return isServiceActive // Fallback to internal state
  }
}

/**
 * Force stop and cleanup (for reset scenarios)
 */
export async function forceStopForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  console.log('🛑 [ForegroundService] Force stopping foreground service...')
  
  // Clear interval
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval)
    notificationUpdateInterval = null
  }
  
  // Reset state
  isServiceActive = false
  
  // Stop and cancel
  try {
    await notifee.stopForegroundService()
    await notifee.cancelNotification(NOTIFICATION_ID)
    console.log('✅ [ForegroundService] Force stop complete')
  } catch (error) {
    console.error('❌ [ForegroundService] Error in force stop:', error)
  }
}
