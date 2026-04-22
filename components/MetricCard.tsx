import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: number; // percentage
  index?: number; // for staggered animation
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon,
  iconColor = Colors.accent,
  trend,
  index = 0,
}: MetricCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(index * 100, withSpring(0, { damping: 18, stiffness: 120 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {trend !== undefined && (
          <View style={[styles.trendBadge, isPositiveTrend ? styles.trendUp : styles.trendDown]}>
            <Ionicons
              name={isPositiveTrend ? 'trending-up' : 'trending-down'}
              size={12}
              color={isPositiveTrend ? Colors.accent : Colors.danger}
            />
            <Text
              style={[styles.trendText, { color: isPositiveTrend ? Colors.accent : Colors.danger }]}
            >
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 148,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 2,
  },
  trendUp: {
    backgroundColor: Colors.accent + '20',
  },
  trendDown: {
    backgroundColor: Colors.danger + '20',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
