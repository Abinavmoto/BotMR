import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Colors } from '@/constants/Colors'

import { NavigationHandler } from '@/src/types/navigation'

interface SettingsScreenProps {
  onNavigate: NavigationHandler
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [showDeleteLocalConfirm, setShowDeleteLocalConfirm] = useState(false)
  const [showDeleteCloudConfirm, setShowDeleteCloudConfirm] = useState(false)
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('high')
  const [processingMode, setProcessingMode] = useState<'cloud' | 'hybrid'>('cloud')
  const [summaryStyle, setSummaryStyle] = useState<'action-focused' | 'detailed' | 'brief'>('action-focused')
  const [calendarSync, setCalendarSync] = useState(false)
  const [autoUpload, setAutoUpload] = useState(true)
  const [showAudioQualityModal, setShowAudioQualityModal] = useState(false)
  const [showProcessingModeModal, setShowProcessingModeModal] = useState(false)
  const [showSummaryStyleModal, setShowSummaryStyleModal] = useState(false)

  const isOnline = true
  const currentPlan = 'Free'
  const meetingsUsed = 8
  const meetingsLimit = 10
  const storageUsed = 65

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
          </Button>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Recording Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording</Text>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Audio Quality</Text>
                <Text style={styles.settingValue}>{audioQuality}</Text>
              </View>
              <Button size="sm" onPress={() => setShowAudioQualityModal(true)}>
                <Text>Change</Text>
              </Button>
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.storageContainer}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Local Storage</Text>
                <Text style={styles.settingValue}>{storageUsed}% used</Text>
              </View>
              <Progress value={storageUsed} />
              <Text style={styles.storageText}>2.1 GB of 3.2 GB</Text>
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-upload when online</Text>
                <Text style={styles.settingDescription}>Recordings sync automatically to cloud</Text>
              </View>
              <Switch value={autoUpload} onValueChange={setAutoUpload} />
            </View>
          </Card>
        </View>

        {/* AI & Processing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI & Processing</Text>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Processing Mode</Text>
                <Text style={styles.settingValue}>{processingMode}</Text>
              </View>
              <Button size="sm" onPress={() => setShowProcessingModeModal(true)}>
                <Text>Change</Text>
              </Button>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Cloud mode:</Text> Fast, accurate AI processing on our servers.{' '}
              <Text style={styles.infoBold}>Hybrid mode:</Text> Basic transcription locally, summary in cloud.
            </Text>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Summary Style</Text>
                <Text style={styles.settingValue}>{summaryStyle.replace('-', ' ')}</Text>
              </View>
              <Button size="sm" onPress={() => setShowSummaryStyleModal(true)}>
                <Text>Change</Text>
              </Button>
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Calendar Integration</Text>
                <Text style={styles.settingValue}>
                  {calendarSync ? 'Synced with Google Calendar' : 'Not connected'}
                </Text>
              </View>
              <Button size="sm" onPress={() => {}}>
                <Text>{calendarSync ? 'Settings' : 'Connect'}</Text>
              </Button>
            </View>
          </Card>
        </View>

        {/* Account & Billing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Billing</Text>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Current Plan</Text>
                <Text style={styles.settingValue}>{currentPlan}</Text>
              </View>
              {currentPlan === 'Free' && (
                <Button size="sm" onPress={() => onNavigate('paywall')}>
                  <Text>Upgrade</Text>
                </Button>
              )}
            </View>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.usageContainer}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Usage This Month</Text>
                <Text style={styles.settingValue}>
                  {meetingsUsed} of {meetingsLimit}
                </Text>
              </View>
              <Progress value={(meetingsUsed / meetingsLimit) * 100} />
              {meetingsUsed >= meetingsLimit * 0.8 && (
                <Text style={styles.warningText}>Running low on meetings. Upgrade for unlimited.</Text>
              )}
            </View>
          </Card>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          {showDeleteLocalConfirm ? (
            <Card style={styles.warningCard}>
              <View style={styles.warningContent}>
                <Ionicons name="warning" size={20} color={Colors.red} />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Delete local recordings?</Text>
                  <Text style={styles.warningDescription}>
                      This will permanently delete 5 recordings stored on this device. Cloud data will not be affected.
                  </Text>
                </View>
              </View>
              <View style={styles.warningButtons}>
                <Button size="sm" variant="outline" onPress={() => setShowDeleteLocalConfirm(false)}>
                  <Text>Cancel</Text>
                  </Button>
                <Button size="sm" variant="destructive" onPress={() => setShowDeleteLocalConfirm(false)}>
                  <Text>Delete Local</Text>
                  </Button>
              </View>
            </Card>
          ) : (
            <Card style={styles.settingCard}>
              <Button
                variant="ghost"
                onPress={() => setShowDeleteLocalConfirm(true)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.mutedForeground} />
                <Text style={styles.deleteButtonText}>Delete local recordings</Text>
              </Button>
            </Card>
          )}

          {showDeleteCloudConfirm ? (
            <Card style={styles.warningCard}>
              <View style={styles.warningContent}>
                <Ionicons name="warning" size={20} color={Colors.red} />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Delete all cloud data?</Text>
                  <Text style={styles.warningDescription}>
                      This will permanently delete 12 meetings, transcripts, and summaries from the cloud. This action
                      cannot be undone.
                  </Text>
                </View>
              </View>
              <View style={styles.warningButtons}>
                <Button size="sm" variant="outline" onPress={() => setShowDeleteCloudConfirm(false)}>
                  <Text>Cancel</Text>
                  </Button>
                <Button size="sm" variant="destructive" onPress={() => setShowDeleteCloudConfirm(false)}>
                  <Text>Delete All</Text>
                  </Button>
              </View>
            </Card>
          ) : (
            <Card style={styles.settingCard}>
              <Button
                variant="ghost"
                onPress={() => setShowDeleteCloudConfirm(true)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.red} />
                <Text style={[styles.deleteButtonText, { color: Colors.red }]}>Delete all cloud data</Text>
              </Button>
            </Card>
          )}

          <Card style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your recordings are encrypted and stored securely. We process audio using AI to generate transcripts and
              summaries. Data is retained for 90 days unless deleted manually.
            </Text>
          </Card>
        </View>
      </View>

      {/* Audio Quality Modal */}
      <Modal visible={showAudioQualityModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAudioQualityModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audio Quality</Text>
              <Button variant="ghost" size="icon" onPress={() => setShowAudioQualityModal(false)}>
                <Ionicons name="close" size={20} color={Colors.foreground} />
              </Button>
            </View>
            <View style={styles.modalOptions}>
              <Button
                variant={audioQuality === 'high' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setAudioQuality('high')
                  setShowAudioQualityModal(false)
                }}
              >
                <Text>High (best quality, larger files)</Text>
              </Button>
              <Button
                variant={audioQuality === 'medium' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setAudioQuality('medium')
                  setShowAudioQualityModal(false)
                }}
              >
                <Text>Medium (balanced)</Text>
              </Button>
              <Button
                variant={audioQuality === 'low' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setAudioQuality('low')
                  setShowAudioQualityModal(false)
                }}
              >
                <Text>Low (smallest files)</Text>
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Processing Mode Modal */}
      <Modal visible={showProcessingModeModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProcessingModeModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Processing Mode</Text>
              <Button variant="ghost" size="icon" onPress={() => setShowProcessingModeModal(false)}>
                <Ionicons name="close" size={20} color={Colors.foreground} />
              </Button>
            </View>
            <View style={styles.modalOptions}>
              <Button
                variant={processingMode === 'cloud' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setProcessingMode('cloud')
                  setShowProcessingModeModal(false)
                }}
              >
                <Text>Cloud (fast, requires internet)</Text>
              </Button>
              <Button
                variant={processingMode === 'hybrid' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setProcessingMode('hybrid')
                  setShowProcessingModeModal(false)
                }}
              >
                <Text>Hybrid (works offline)</Text>
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Summary Style Modal */}
      <Modal visible={showSummaryStyleModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSummaryStyleModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Summary Style</Text>
              <Button variant="ghost" size="icon" onPress={() => setShowSummaryStyleModal(false)}>
                <Ionicons name="close" size={20} color={Colors.foreground} />
              </Button>
            </View>
            <View style={styles.modalOptions}>
              <Button
                variant={summaryStyle === 'action-focused' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setSummaryStyle('action-focused')
                  setShowSummaryStyleModal(false)
                }}
              >
                <Text>Action-focused (decisions & tasks)</Text>
              </Button>
              <Button
                variant={summaryStyle === 'detailed' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setSummaryStyle('detailed')
                  setShowSummaryStyleModal(false)
                }}
              >
                <Text>Detailed (comprehensive)</Text>
              </Button>
              <Button
                variant={summaryStyle === 'brief' ? 'default' : 'outline'}
                style={styles.modalOption}
                onPress={() => {
                  setSummaryStyle('brief')
                  setShowSummaryStyleModal(false)
                }}
              >
                <Text>Brief (key points only)</Text>
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.foreground,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  settingCard: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textTransform: 'capitalize',
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  storageContainer: {
    gap: 12,
  },
  storageText: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  usageContainer: {
    gap: 12,
  },
  warningText: {
    fontSize: 12,
    color: Colors.orange,
  },
  infoCard: {
    borderColor: Colors.accent + '4D',
    backgroundColor: Colors.accent + '0D',
    padding: 16,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.mutedForeground,
  },
  infoBold: {
    fontWeight: '500',
    color: Colors.foreground,
  },
  warningCard: {
    borderColor: Colors.red + '4D',
    backgroundColor: Colors.red + '0D',
    padding: 16,
    gap: 12,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.red,
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  warningButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    width: '100%',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.foreground,
  },
  modalOptions: {
    gap: 8,
  },
  modalOption: {
    width: '100%',
  },
})
