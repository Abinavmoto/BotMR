import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Colors } from '@/constants/Colors'

import { NavigationHandler } from '@/src/types/navigation'

interface ProcessingScreenProps {
  onNavigate: NavigationHandler
}

export function ProcessingScreen({ onNavigate }: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Transcribing audio')
  const [showSuccess, setShowSuccess] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('Q4 Planning Session')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const isOffline = false
  const isPartialProcessing = false
  const pulseAnim = new Animated.Value(1)

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  useEffect(() => {
    if (isOffline) {
      setStep('Queued for processing')
      return
    }

    if (isPartialProcessing) {
      setProgress(65)
      setStep('Transcription complete – waiting to generate summary')
      return
    }

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer)
          setShowSuccess(true)
          return 100
        }
        const newProgress = oldProgress + 2

        if (newProgress > 30 && newProgress < 35) {
          setStep('Analyzing content')
        } else if (newProgress > 60 && newProgress < 65) {
          setStep('Generating summary')
        } else if (newProgress > 90) {
          setStep('Finalizing')
        }

        return newProgress
      })
    }, 100)

    return () => clearInterval(timer)
  }, [isOffline, isPartialProcessing])

  if (showSuccess) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.pulseBg,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.2, 0],
                  }),
                },
              ]}
            />
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.accent} />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.successTitle}>Meeting Processed</Text>
            <Text style={styles.successSubtitle}>Your summary is ready</Text>
          </View>

          <Card style={styles.titleCard}>
            <Text style={styles.cardLabel}>Meeting Name</Text>
            {isEditingTitle ? (
              <View style={styles.editContainer}>
                <Input
                  value={meetingTitle}
                  onChangeText={setMeetingTitle}
                  style={styles.titleInput}
                  autoFocus
                />
                <Button size="sm" onPress={() => setIsEditingTitle(false)}>
                  <Text>Save</Text>
                </Button>
              </View>
            ) : (
              <View style={styles.titleRow}>
                <Text style={styles.titleText}>{meetingTitle}</Text>
                <Button
                  size="icon"
                  variant="ghost"
                  onPress={() => setIsEditingTitle(true)}
                >
                  <Ionicons name="pencil" size={16} color={Colors.foreground} />
                </Button>
              </View>
            )}
          </Card>

          <Button size="lg" onPress={() => onNavigate('summary')} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Summary</Text>
          </Button>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.processingContainer}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.pulseBg,
              {
                backgroundColor: isOffline ? Colors.orange + '33' : Colors.accent + '33',
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.2, 0],
                }),
              },
            ]}
            />
          <View style={[styles.iconCircle, { backgroundColor: isOffline ? Colors.orange + '1A' : Colors.accent + '1A' }]}>
            <Ionicons
              name={isOffline ? 'wifi-outline' : 'sparkles'}
              size={64}
              color={isOffline ? Colors.orange : Colors.accent}
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          {isOffline ? (
            <>
              <Text style={styles.statusTitle}>Queued for Processing</Text>
              <Text style={styles.statusSubtitle}>Recording saved locally. Will process when online.</Text>
            </>
          ) : (
            <>
              <Text style={styles.statusTitle}>Processing Meeting</Text>
              <Text style={styles.statusSubtitle}>{step}</Text>
            </>
          )}
        </View>

        {!isOffline && (
          <>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Progress value={progress} />
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>{step}</Text>
                <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
              </View>
            </View>

            {/* Processing Steps */}
            <View style={styles.stepsContainer}>
              <ProcessingStep completed={progress > 30} active={progress <= 30} label="Transcribing audio" />
              <ProcessingStep
                completed={progress > 60}
                active={progress > 30 && progress <= 60}
                label="Analyzing content"
              />
              <ProcessingStep
                completed={progress > 90}
                active={progress > 60 && progress <= 90}
                label="Generating summary"
              />
            </View>
          </>
        )}

        {isOffline && (
          <View style={styles.offlineContainer}>
            <Ionicons name="reload" size={16} color={Colors.orange} />
            <Text style={styles.offlineText}>Waiting for connection</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function ProcessingStep({ completed, active, label }: { completed: boolean; active: boolean; label: string }) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          completed && styles.stepCircleCompleted,
          active && !completed && styles.stepCircleActive,
        ]}
      >
        {completed && <Ionicons name="document-text" size={12} color={Colors.accentForeground} />}
      </View>
      <Text style={[styles.stepLabel, (completed || active) && styles.stepLabelActive]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  successContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 32,
  },
  processingContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 32,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBg: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  titleCard: {
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.mutedForeground,
    marginBottom: 12,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleInput: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
  },
  viewButton: {
    width: '100%',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  progressContainer: {
    gap: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  stepsContainer: {
    gap: 12,
    paddingTop: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: Colors.accent,
  },
  stepCircleCompleted: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  stepLabelActive: {
    color: Colors.foreground,
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  offlineText: {
    fontSize: 14,
    color: Colors.orange,
  },
})
