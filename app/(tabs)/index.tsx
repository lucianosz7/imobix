import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MetricCard } from '../../components/MetricCard';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { useFocusEffect } from 'expo-router';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <View style={chartStyles.container}>
      {data.map((val, i) => (
        <View key={i} style={chartStyles.barWrapper}>
          <View
            style={[
              chartStyles.bar,
              {
                height: max > 0 ? (val / max) * 50 : 4,
                backgroundColor: i === data.length - 1 ? Colors.accent : Colors.accent + '50',
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 60,
    paddingTop: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '75%',
    borderRadius: 4,
    minHeight: 4,
  },
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia ☀️';
  if (hour >= 12 && hour < 18) return 'Boa tarde 🌞';
  if (hour >= 18) return 'Boa noite 🌙';
  return 'Olá 👋'; // madrugada 00h-04h
}

export default function DashboardScreen() {
  const [metrics, setMetrics] = React.useState({
    totalRevenue: 0,
    netProfit: 0,
    totalProperties: 0,
    rentedProperties: 0,
    vacantProperties: 0,
    underMaintenanceCount: 0,
    occupancyRate: 0,
  });
  const [recentProperties, setRecentProperties] = React.useState<any[]>([]);
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState('');

  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(-20);
  const chartOpacity = useSharedValue(0);
  const chartTranslate = useSharedValue(30);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    headerTranslate.value = withSpring(0, { damping: 18, stiffness: 100 });
    chartOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    chartTranslate.value = withDelay(400, withSpring(0, { damping: 18, stiffness: 100 }));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
      // Recarrega o perfil toda vez que voltar ao dashboard
      AsyncStorage.getItem('@imobix_profile').then((raw) => {
        if (raw) {
          const p = JSON.parse(raw);
          setAvatarUri(p.avatarUri || null);
          setUserName(p.name || '');
        }
      });
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const data = await api.getProperties();
      const props: any[] = data || [];
      
      const totalProperties = props.length;
      let totalRevenue = 0;
      let rentedProperties = 0;
      let underMaintenanceCount = 0;

      props.forEach((p: any) => {
        // Backend usa is_rented (bool) e under_maintenance (bool)
        if (p.is_rented) rentedProperties++;
        if (p.under_maintenance) underMaintenanceCount++;
        totalRevenue += (p.rent_value || 0);
      });

      const vacantProperties = totalProperties - rentedProperties - underMaintenanceCount;
      const occupancyRate = totalProperties > 0
        ? Math.round((rentedProperties / totalProperties) * 100)
        : 0;
      const netProfit = totalRevenue * 0.85;

      setMetrics({
        totalRevenue,
        netProfit,
        totalProperties,
        rentedProperties,
        vacantProperties,
        underMaintenanceCount,
        occupancyRate,
      });

      setRecentProperties(props.slice(0, 3));
    } catch (e) {
      console.error(e);
    }
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const chartStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
    transform: [{ translateY: chartTranslate.value }],
  }));

  // last 6 months profit data
  const profitHistory = [18500, 20100, 17800, 21200, 19600, 22400];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.headerTitle}>Resumo do mês</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName ? userName.charAt(0).toUpperCase() : 'IM'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Hero metric */}
      <Animated.View style={[styles.heroCard, headerStyle]}>
        <View style={styles.heroTop}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="wallet-outline" size={22} color={Colors.accent} />
          </View>
          <View style={styles.trendPill}>
            <Ionicons name="trending-up" size={13} color={Colors.accent} />
            <Text style={styles.trendPillText}>+8,4%</Text>
          </View>
        </View>
        <Text style={styles.heroLabel}>Receita Mensal Total</Text>
        <Text style={styles.heroValue}>{formatCurrency(metrics.totalRevenue)}</Text>
        <Text style={styles.heroSub}>
          Lucro líquido:{' '}
          <Text style={styles.heroSubAccent}>{formatCurrency(metrics.netProfit)}</Text>
        </Text>
      </Animated.View>

      {/* Metric cards row - horizontal carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.metricsScroll}
        contentContainerStyle={styles.metricsRow}
      >
        <MetricCard
          label="Imóveis"
          value={String(metrics.totalProperties)}
          subtitle={`${metrics.rentedProperties} alugados`}
          icon="business-outline"
          iconColor={Colors.accent}
          index={0}
        />
        <MetricCard
          label="Vagos"
          value={String(metrics.vacantProperties)}
          subtitle="disponíveis"
          icon="home-outline"
          iconColor={Colors.warning}
          index={1}
        />
        <MetricCard
          label="Manutenção"
          value={String(metrics.underMaintenanceCount)}
          subtitle="indisponíveis"
          icon="construct-outline"
          iconColor={Colors.danger}
          index={2}
        />
        <MetricCard
          label="Ocupação"
          value={`${metrics.occupancyRate}%`}
          icon="stats-chart-outline"
          iconColor={Colors.accent}
          index={3}
        />
        <MetricCard
          label="Receita"
          value={metrics.totalRevenue > 0 ? `R$ ${(metrics.totalRevenue / 1000).toFixed(1)}k` : 'R$ 0'}
          subtitle="total mensal"
          icon="cash-outline"
          iconColor={Colors.accent}
          index={4}
        />
      </ScrollView>

      {/* Revenue chart */}
      <Animated.View style={chartStyle}>
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>Lucro — Últimos 6 meses</Text>
              <Text style={styles.chartSub}>Histórico consolidado</Text>
            </View>
            <TouchableOpacity style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Ver mais</Text>
            </TouchableOpacity>
          </View>
          <MiniBarChart data={profitHistory} />
          <View style={styles.monthLabels}>
            {months.map((m) => (
              <Text key={m} style={styles.monthLabel}>
                {m}
              </Text>
            ))}
          </View>
          <View style={styles.chartDivider} />
          <View style={styles.chartStats}>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Melhor mês</Text>
              <Text style={styles.chartStatValue}>{formatCurrency(22400)}</Text>
            </View>
            <View style={styles.chartStatDivider} />
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Média mensal</Text>
              <Text style={styles.chartStatValue}>
                {formatCurrency(profitHistory.reduce((a, b) => a + b, 0) / profitHistory.length)}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Recent properties */}
      <Animated.View style={chartStyle}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Imóveis recentes</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/properties')}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {recentProperties.map((property) => {
          const isAlugado = property.is_rented;
          const isManutencao = property.under_maintenance;
          const statusLabel = isAlugado ? 'alugado' : isManutencao ? 'manutenção' : 'vago';
          return (
            <Card
              key={property.id}
              style={styles.propertyCard}
              onPress={() => router.push(`/property/${property.id}`)}
            >
              <View style={styles.propertyCardRow}>
                <View style={styles.propertyIcon}>
                  <Ionicons name="business" size={20} color={Colors.accent} />
                </View>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>{property.name}</Text>
                  <Text style={styles.propertyType}>{property.type || 'Imóvel'}</Text>
                </View>
                <View style={styles.propertyRight}>
                  <Text style={styles.propertyRent}>{formatCurrency(property.rent_value)}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isAlugado ? styles.statusAlugado : styles.statusVago,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isAlugado ? styles.statusTextAlugado : styles.statusTextVago,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          );
        })}
      </Animated.View>
    </ScrollView>
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
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 3,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  avatarBtn: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent + '20',
    borderWidth: 1.5,
    borderColor: Colors.accent + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.accent + '50',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: Colors.accent + '30',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '20',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendPillText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  heroLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  heroValue: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSub: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  heroSubAccent: {
    color: Colors.accent,
    fontWeight: '700',
  },
  metricsScroll: {
    marginHorizontal: -20, // Sangra até a borda
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingRight: 20,
  },
  chartCard: {
    gap: 0,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  chartSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  monthLabels: {
    flexDirection: 'row',
    marginTop: 6,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  chartDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  chartStats: {
    flexDirection: 'row',
  },
  chartStat: {
    flex: 1,
    alignItems: 'center',
  },
  chartStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  chartStatLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  chartStatValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllBtn: {},
  seeAllText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  propertyCard: {
    marginTop: 10,
  },
  propertyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  propertyType: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  propertyRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  propertyRent: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusAlugado: {
    backgroundColor: Colors.accent + '20',
  },
  statusVago: {
    backgroundColor: Colors.warning + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusTextAlugado: {
    color: Colors.accent,
  },
  statusTextVago: {
    color: Colors.warning,
  },
});
