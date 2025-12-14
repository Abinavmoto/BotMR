import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Colors } from '@/constants/Colors'

import { NavigationHandler } from '@/src/types/navigation'

interface SummaryScreenProps {
  onNavigate: NavigationHandler
}

export function SummaryScreen({ onNavigate }: SummaryScreenProps) {
  const [meetingTitle, setMeetingTitle] = useState('Q4 Planning Session')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [summaryText, setSummaryText] = useState(
    'Discussed Q4 objectives focusing on product launches and market expansion. Team agreed on three priority initiatives: mobile app redesign, customer retention program, and partnership development in APAC region.',
  )
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [editedSummaryText, setEditedSummaryText] = useState(summaryText)
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)

  const handleSaveSummary = () => {
    setSummaryText(editedSummaryText)
    setIsEditingSummary(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => onNavigate('home')}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
        </Button>
        <View style={styles.headerButtons}>
          <Button variant="ghost" size="icon" onPress={() => {}}>
            <Ionicons name="share-outline" size={20} color={Colors.foreground} />
          </Button>
          <Button variant="ghost" size="icon" onPress={() => setShowDownloadOptions(true)}>
            <Ionicons name="download-outline" size={20} color={Colors.foreground} />
            </Button>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Meeting Title */}
        <View style={styles.titleSection}>
          {isEditingTitle ? (
            <View style={styles.titleEditContainer}>
              <Input
                value={meetingTitle}
                onChangeText={setMeetingTitle}
                style={styles.titleInput}
                autoFocus
              />
              <Button size="icon" variant="ghost" onPress={() => setIsEditingTitle(false)}>
                <Ionicons name="checkmark" size={16} color={Colors.foreground} />
              </Button>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={styles.title}>{meetingTitle}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.subtitle}>45 minutes • Today at 2:30 PM</Text>
        </View>

        {/* Summary Section */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              </View>
              <Text style={styles.sectionLabel}>Summary</Text>
            </View>
            <View style={styles.cardHeaderButtons}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditedSummaryText(summaryText)
                  setIsEditingSummary(true)
                }}
              >
                <Ionicons name="pencil" size={14} color={Colors.foreground} />
              </Button>
              <Button variant="ghost" size="sm" onPress={() => setShowRegenerateOptions(true)}>
                <Ionicons name="refresh" size={14} color={Colors.foreground} />
              </Button>
            </View>
          </View>

          {isEditingSummary ? (
            <View style={styles.editContainer}>
              <Textarea
                value={editedSummaryText}
                onChangeText={setEditedSummaryText}
                numberOfLines={6}
                style={styles.summaryTextarea}
                autoFocus
              />
              <View style={styles.editButtons}>
                <Button size="sm" variant="outline" onPress={() => setIsEditingSummary(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button size="sm" onPress={handleSaveSummary}>
                  <Text>Save</Text>
                </Button>
              </View>
            </View>
          ) : (
            <Text style={styles.summaryText}>{summaryText}</Text>
          )}
        </Card>

        {/* Decisions Section */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              </View>
              <Text style={styles.sectionLabel}>Key Decisions</Text>
            </View>
          </View>
          <View style={styles.list}>
            <DecisionItem text="Allocate $200K budget for mobile redesign" />
            <DecisionItem text="Launch retention program by end of October" />
            <DecisionItem text="Prioritize APAC expansion over European markets" />
          </View>
        </Card>

        {/* Action Items Section */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              </View>
              <Text style={styles.sectionLabel}>Action Items</Text>
            </View>
          </View>
          <View style={styles.actionItems}>
            <ActionItem label="Schedule design review with product team" assignee="Sarah" dueDate="Oct 15" />
            <ActionItem label="Draft retention program proposal" assignee="Mike" dueDate="Oct 18" />
            <ActionItem label="Research APAC partnership opportunities" assignee="Jessica" dueDate="Oct 20" />
            <ActionItem label="Prepare budget allocation document" assignee="Tom" dueDate="Oct 22" />
          </View>
        </Card>
      </View>

      {/* Modals */}
      <Modal visible={showRegenerateOptions} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegenerateOptions(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Regenerate Summary</Text>
              <Button variant="ghost" size="icon" onPress={() => setShowRegenerateOptions(false)}>
                <Ionicons name="close" size={20} color={Colors.foreground} />
              </Button>
            </View>
            <Text style={styles.modalDescription}>
              Choose a style to regenerate the AI summary. Your manual edits will be preserved.
            </Text>
            <View style={styles.modalOptions}>
              <Button
                style={styles.modalOption}
                onPress={() => {
                  // In a real app, this would trigger AI regeneration
                  console.log('Regenerating with action-focused style')
                  setShowRegenerateOptions(false)
                }}
              >
                <Text>Action-focused</Text>
              </Button>
              <Button
                style={styles.modalOption}
                onPress={() => {
                  // In a real app, this would trigger AI regeneration
                  console.log('Regenerating with detailed style')
                  setShowRegenerateOptions(false)
                }}
              >
                <Text>Detailed</Text>
              </Button>
              <Button
                style={styles.modalOption}
                onPress={() => {
                  // In a real app, this would trigger AI regeneration
                  console.log('Regenerating with brief style')
                  setShowRegenerateOptions(false)
                }}
              >
                <Text>Brief</Text>
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showDownloadOptions} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDownloadOptions(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download Meeting</Text>
              <Button variant="ghost" size="icon" onPress={() => setShowDownloadOptions(false)}>
                <Ionicons name="close" size={20} color={Colors.foreground} />
              </Button>
            </View>
            <Button style={styles.downloadButton} onPress={() => setShowDownloadOptions(false)}>
              <Text style={styles.downloadButtonText}>Download PDF</Text>
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}

function DecisionItem({ text }: { text: string }) {
  return (
    <View style={styles.decisionItem}>
      <View style={styles.decisionDot} />
      <Text style={styles.decisionText}>{text}</Text>
    </View>
  )
}

function ActionItem({ label, assignee, dueDate }: { label: string; assignee: string; dueDate?: string }) {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <View style={styles.actionItem}>
      <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
      <View style={styles.actionItemContent}>
        <Text style={[styles.actionItemText, isChecked && styles.actionItemTextChecked]}>{label}</Text>
        <View style={styles.actionItemMeta}>
          <Text style={styles.actionItemMetaText}>{assignee}</Text>
          {dueDate && (
            <>
              <Text style={styles.actionItemMetaText}>•</Text>
              <Text style={styles.actionItemMetaText}>Due {dueDate}</Text>
            </>
          )}
        </View>
      </View>
    </View>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  titleSection: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '500',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 30,
    fontWeight: '500',
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.mutedForeground,
  },
  cardHeaderButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editContainer: {
    gap: 12,
  },
  summaryTextarea: {
    minHeight: 100,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.foreground,
  },
  list: {
    gap: 12,
  },
  decisionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  decisionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  decisionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.foreground,
  },
  actionItems: {
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionItemContent: {
    flex: 1,
  },
  actionItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.foreground,
  },
  actionItemTextChecked: {
    textDecorationLine: 'line-through',
    color: Colors.mutedForeground,
  },
  actionItemMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  actionItemMetaText: {
    fontSize: 12,
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
  modalDescription: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  modalOptions: {
    gap: 8,
  },
  modalOption: {
    width: '100%',
  },
  downloadButton: {
    width: '100%',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})
