import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '@/constants/Colors'

interface TabsProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  className?: string
}

interface TabsListProps {
  children?: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children?: React.ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children?: React.ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(value || '')
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <View style={styles.container}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            currentValue,
            onValueChange: handleValueChange,
          })
        }
        return child
      })}
    </View>
  )
}

export function TabsList({ children, currentValue, onValueChange }: TabsListProps & { currentValue?: string; onValueChange?: (value: string) => void }) {
  return (
    <View style={styles.list}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.value !== undefined) {
          return React.cloneElement(child as any, {
            isActive: currentValue === child.props.value,
            onPress: () => onValueChange?.(child.props.value),
          })
        }
        return child
      })}
    </View>
  )
}

export function TabsTrigger({ value, children, isActive, onPress }: TabsTriggerProps & { isActive?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.trigger, isActive && styles.triggerActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.triggerText, isActive && styles.triggerTextActive]}>{children}</Text>
    </TouchableOpacity>
  )
}

export function TabsContent({ value, children, currentValue }: TabsContentProps & { currentValue?: string }) {
  if (currentValue !== value) return null
  return <View style={styles.content}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flexDirection: 'row',
    backgroundColor: Colors.muted,
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  trigger: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerActive: {
    backgroundColor: Colors.background,
  },
  triggerText: {
    fontSize: 12,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  triggerTextActive: {
    color: Colors.foreground,
  },
  content: {
    marginTop: 16,
  },
})
