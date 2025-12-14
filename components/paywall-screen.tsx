import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Colors } from '@/constants/Colors'

import { NavigationHandler } from '@/src/types/navigation'

interface PaywallScreenProps {
  onNavigate: NavigationHandler
}

export function PaywallScreen({ onNavigate }: PaywallScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => onNavigate('home')}>
          <Ionicons name="close" size={20} color={Colors.foreground} />
        </Button>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topSection}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={48} color={Colors.accent} />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Unlock Unlimited Meetings</Text>
            <Text style={styles.subtitle}>Record as many meetings as you need with BotMR Pro</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Feature text="Unlimited meeting recordings" />
            <Feature text="Advanced AI summaries" />
            <Feature text="Priority processing" />
            <Feature text="Export to all formats" />
            <Feature text="Team collaboration" />
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingSection}>
          <Card style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>$9.99</Text>
                <Text style={styles.priceUnit}>/month</Text>
              </View>
              <Text style={styles.cancelText}>Cancel anytime</Text>
            </View>

            <Button
              size="lg"
              onPress={() => onNavigate('home')}
              style={styles.subscribeButton}
            >
              <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
            </Button>
          </Card>

          <Text style={styles.trialText}>7-day free trial, then $9.99/month</Text>
        </View>
      </View>
    </ScrollView>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name="checkmark" size={16} color={Colors.accent} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
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
  header: {
    marginBottom: 32,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    gap: 32,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '500',
    color: Colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  featuresContainer: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    color: Colors.foreground,
  },
  pricingSection: {
    gap: 16,
  },
  pricingCard: {
    borderColor: Colors.accent + '33',
    backgroundColor: Colors.card,
    padding: 24,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '500',
    color: Colors.foreground,
  },
  priceUnit: {
    fontSize: 16,
    color: Colors.mutedForeground,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  subscribeButton: {
    width: '100%',
    backgroundColor: Colors.accent,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.accentForeground,
  },
  trialText: {
    fontSize: 12,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
})
