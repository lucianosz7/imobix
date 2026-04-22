import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../services/api';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function HistoryBar({ month, profit, maxProfit }: { month: string; profit: number; maxProfit: number }) {
  const isNegative = profit < 0;
  const barHeight = maxProfit > 0 ? (Math.abs(profit) / maxProfit) * 64 : 4;

  return (
    <View style={histStyles.col}>
      <Text style={histStyles.value}>
        {profit >= 0 ? formatCurrency(profit) : '-'}
      </Text>
      <View style={histStyles.barWrap}>
        <View
          style={[
            histStyles.bar,
            {
              height: barHeight,
              backgroundColor: isNegative ? Colors.danger + '70' : Colors.accent + '80',
            },
          ]}
        />
      </View>
      <Text style={histStyles.month}>{month}</Text>
    </View>
  );
}

const histStyles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barWrap: {
    height: 64,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    minHeight: 4,
  },
  value: {
    color: Colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
  },
  month: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showMenu, setShowMenu] = React.useState(false);

  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(-20);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(30);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerTranslate.value = withSpring(0, { damping: 18 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    contentTranslate.value = withDelay(200, withSpring(0, { damping: 18 }));
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProperty();
    }, [id])
  );

  const fetchProperty = async () => {
    try {
      const data = await api.getPropertyById(id);
      setProperty({
        ...data,
        // Derive display status from boolean flags
        status: data.is_rented ? 'alugado' : data.under_maintenance ? 'manutenção' : 'vago',
        type: data.type || 'Apartamento',
        rent: data.rent_value || 0,
        costs: data.costs || 0,
        history: data.history || [
          { month: 'Atual', revenue: data.rent_value || 0, costs: data.costs || 0, profit: (data.rent_value || 0) - (data.costs || 0) }
        ],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOptions = () => {
    setShowMenu(true);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/properties');
    }
  };

  const confirmDelete = () => {
    setShowMenu(false);
    
    setTimeout(() => {
      if (Platform.OS === 'web') {
        if (window.confirm(`Tem certeza que deseja excluir "${property?.name}"? Esta ação não pode ser desfeita.`)) {
          handleDelete();
        }
      } else {
        Alert.alert(
          'Excluir imóvel?',
          `Tem certeza que deseja excluir "${property?.name}"? Esta ação não pode ser desfeita.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: handleDelete },
          ]
        );
      }
    }, 150);
  };

  const handleDelete = async () => {
    try {
      await api.deleteProperty(id);
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Imóvel excluído!',
      });
      router.replace('/(tabs)/properties');
    } catch (e) {
      // Erro já tratado com Toast global
    }
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  if (loading) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Carregando...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="home-outline" size={48} color={Colors.muted} />
        <Text style={styles.notFoundText}>Imóvel não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAlugado = property.status === 'alugado';
  const profit = property.rent - property.costs;
  const yield_ = ((profit / property.rent) * 100).toFixed(1);
  const maxProfit = Math.max(...property.history.map((h: any) => h.profit));

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Back header */}
        <Animated.View style={[styles.topBar, headerStyle]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Detalhe</Text>
          <TouchableOpacity style={styles.optionsBtn} onPress={handleOptions}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero card */}
        <Animated.View style={[styles.heroCard, headerStyle]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons
                name={
                  property.type === 'Apartamento'
                    ? 'business'
                    : property.type === 'Casa'
                    ? 'home'
                    : property.type === 'Sala Comercial'
                    ? 'briefcase'
                    : 'cube'
                }
                size={28}
                color={isAlugado ? Colors.accent : Colors.warning}
              />
            </View>
            <View
              style={[styles.statusBadge, isAlugado ? styles.badgeAlugado : styles.badgeVago]}
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
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyType}>{property.type}</Text>
        </Animated.View>

        {/* Financial metrics */}
        <Animated.View style={[contentStyle, styles.contentStack]}>
          {/* Row 1 */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.accent + '18' }]}>
                <Ionicons name="cash-outline" size={18} color={Colors.accent} />
              </View>
              <Text style={styles.metricValue}>{formatCurrency(property.rent)}</Text>
              <Text style={styles.metricLabel}>Aluguel/mês</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.accent + '18' }]}>
                <Ionicons name="stats-chart-outline" size={18} color={Colors.accent} />
              </View>
              <Text style={styles.metricValue}>{property.is_rented ? 'Alugado' : 'Vago'}</Text>
              <Text style={styles.metricLabel}>Status</Text>
            </View>
          </View>

          {/* History chart */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>Histórico de lucro</Text>
                <Text style={styles.historySubtitle}>Últimos 6 meses</Text>
              </View>
            </View>
            <View style={styles.historyChart}>
              {property.history.map((h: any, i: number) => (
                <HistoryBar
                  key={h.month}
                  month={h.month}
                  profit={h.profit}
                  maxProfit={maxProfit}
                />
              ))}
            </View>
            <View style={styles.historyDivider} />
            {/* History table */}
            <View style={styles.historyTable}>
              {property.history.slice().reverse().map((h: any) => (
                <View key={h.month} style={styles.historyRow}>
                  <Text style={styles.historyRowMonth}>{h.month}</Text>
                  <Text style={styles.historyRowRevenue}>{formatCurrency(h.revenue)}</Text>
                  <Text style={styles.historyRowCosts}>-{formatCurrency(h.costs)}</Text>
                  <Text
                    style={[
                      styles.historyRowProfit,
                      { color: h.profit >= 0 ? Colors.accent : Colors.danger },
                    ]}
                  >
                    {formatCurrency(h.profit)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <View style={styles.menuHandle} />
                <Text style={styles.menuTitle}>Opções do Imóvel</Text>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push(`/property/edit/${id}`);
                  }}
                >
                  <Ionicons name="pencil-outline" size={20} color={Colors.text} />
                  <Text style={styles.menuItemText}>Editar Imóvel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDestructive]}
                  onPress={confirmDelete}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  <Text style={[styles.menuItemText, { color: Colors.danger }]}>Excluir Imóvel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuCancel}
                  onPress={() => setShowMenu(false)}
                >
                  <Text style={styles.menuCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 16,
  },
  notFound: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  backLink: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  contentStack: {
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topBarTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  optionsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeAlugado: {
    backgroundColor: Colors.accent + '18',
  },
  badgeVago: {
    backgroundColor: Colors.warning + '18',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  propertyName: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  propertyType: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  addressText: {
    color: Colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  profitCard: {
    flex: 1.3,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  tenantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tenantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tenantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tenantAvatarText: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  tenantLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  tenantName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.accent + '15',
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  contactBtnText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  historyTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  historySubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 12,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  historyTable: {
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRowMonth: {
    color: Colors.textMuted,
    fontSize: 12,
    width: 32,
    fontWeight: '600',
  },
  historyRowRevenue: {
    color: Colors.textSecondary,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  historyRowCosts: {
    color: Colors.danger,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  historyRowProfit: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  menuTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  menuItemDestructive: {
    backgroundColor: Colors.danger + '10',
  },
  menuItemText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  menuCancel: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  menuCancelText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
