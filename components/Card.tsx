import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'accent';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'accent' && styles.accent,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedTouchable
        style={[animatedStyle, cardStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.accent + '40',
    borderWidth: 1.5,
  },
});
