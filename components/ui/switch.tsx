import React from 'react'
import { Switch as RNSwitch, StyleSheet } from 'react-native'
import { Colors } from '@/constants/Colors'

interface SwitchProps {
  value?: boolean
  onValueChange?: (value: boolean) => void
  disabled?: boolean
  defaultChecked?: boolean
}

export function Switch({ value, onValueChange, disabled, defaultChecked }: SwitchProps) {
  const [internalValue, setInternalValue] = React.useState(defaultChecked ?? false)
  const isControlled = value !== undefined

  const handleValueChange = (newValue: boolean) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <RNSwitch
      value={isControlled ? value : internalValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      trackColor={{ false: Colors.input, true: Colors.primary }}
      thumbColor={Colors.background}
      ios_backgroundColor={Colors.input}
      />
  )
}
