import React from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  style?: any
}

export function Checkbox({ checked = false, onCheckedChange, disabled, style }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={[styles.checkbox, checked && styles.checked, style]}
      onPress={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {checked && <Ionicons name="checkmark" size={14} color={Colors.primaryForeground} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.input,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
})
