import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';

// Create a Property interface matching the backend format
export interface Property {
  id: string | number;
  name: string;
  address?: string;
  status?: string; // Inferred or default
  type?: string;   // Inferred or default
  tenant?: string; // Mock or null
  rent?: number;   // Calculated from incomes
  costs?: number;  // Calculated from expenses
}

function formatCurrency(value?: number): string {
  return (value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function PropertyItem({ property, index }: { property: Property; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 80, withSpring(0, { damping: 18 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const isAlugado = property.status === 'alugado';
  // Infer profit from properties metrics if available
  const rent = property.rent || 0;
  const costs = property.costs || 0;
  const profit = rent - costs;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.propertyCard}
        onPress={() => router.push(`/property/${property.id}`)}
        activeOpacity={0.85}
      >
        {/* Left icon */}
        <View style={styles.propertyIconWrap}>
          <Ionicons
            name={
              property.type === 'Apartamento'
                ? 'business'
                : property.type === 'Casa'
                ? 'home'
                : property.type === 'Sala Comercial'
                ? 'briefcase'
                : 'cube-outline'
            }
            size={22}
            color={isAlugado ? Colors.accent : Colors.warning}
          />
        </View>

        {/* Info */}
        <View style={styles.propertyInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <View
              style={[styles.statusBadge, isAlugado ? styles.statusBadgeAlugado : styles.statusBadgeVago]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: isAlugado ? Colors.accent : Colors.warning }]}
              />
              <Text
                style={[styles.statusText, { color: isAlugado ? Colors.accent : Colors.warning }]}
              >
                {property.status}
              </Text>
            </View>
          </View>

          <Text style={styles.propertyType}>{property.type}</Text>

          {property.tenant && (
            <View style={styles.tenantRow}>
              <Ionicons name="person-outline" size={11} color={Colors.muted} />
              <Text style={styles.tenantText}>{property.tenant}</Text>
            </View>
          )}

          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Aluguel</Text>
              <Text style={styles.financialValue}>{formatCurrency(rent)}</Text>
            </View>
            <View style={styles.financialDivider} />
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Lucro</Text>
              <Text style={[styles.financialValue, { color: Colors.accent }]}>
                {formatCurrency(profit)}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PropertiesScreen() {
  const [filter, setFilter] = useState<'todos' | 'alugado' | 'vago'>('todos');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProperties();
    }, [])
  );

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await api.getProperties();
      // data is an array of properties: { id, user_id, name, address }
      const mapped = (data || []).map((p: any) => ({
        ...p,
        rent: p.rent_value || 0,
        costs: p.costs || 0,
        // Derive display status from boolean flags (backend uses is_rented/under_maintenance)
        status: p.is_rented ? 'alugado' : p.under_maintenance ? 'manutenção' : 'vago',
        type: p.type || 'Apartamento',
      }));
      setProperties(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const filtered = filter === 'todos'
    ? properties
    : properties.filter((p) => p.status === filter);

  return (
    <View style={styles.root}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={styles.title}>Meus Imóveis</Text>
          <Text style={styles.subtitle}>{properties.length} imóveis cadastrados</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(tabs)/add')}
        >
          <Ionicons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(['todos', 'alugado', 'vago'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={fetchProperties}
        renderItem={({ item, index }) => <PropertyItem property={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={48} color={Colors.muted} />
            <Text style={styles.emptyText}>
              {loading ? 'Carregando...' : 'Nenhum imóvel encontrado'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    maxHeight: 44,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingRight: 20,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.accent,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  propertyIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  propertyInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  statusBadgeAlugado: {
    backgroundColor: Colors.accent + '18',
  },
  statusBadgeVago: {
    backgroundColor: Colors.warning + '18',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  propertyType: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tenantText: {
    color: Colors.muted,
    fontSize: 11,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  financialItem: {
    gap: 2,
  },
  financialDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  financialLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  financialValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
});
