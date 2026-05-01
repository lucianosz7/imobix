import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { removeToken, api } from '../services/api';
import PaymentModal from '../components/PaymentModal';

const PROFILE_KEY = '@imobix_profile';

interface Profile {
  name: string;
  email: string;
  plan?: string;
  avatarUri: string | null;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    plan: 'free',
    avatarUri: null,
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentBillId, setPaymentBillId] = useState<string | null>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 18 });
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // 1. Carrega cache local imediatamente (resposta instantânea)
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      const local = raw ? JSON.parse(raw) : {};

      if (local.name || local.email) {
        setProfile((prev) => ({ ...prev, ...local }));
        setNameInput(local.name || '');
      }

      // 2. Busca dados atualizados do servidor
      try {
        const serverUser = await api.getMe();
        // API retorna { id, name, email, plan, created_at }
        const name = serverUser?.name || local.name || '';
        const email = serverUser?.email || local.email || '';
        const plan = serverUser?.plan || local.plan || 'free';

        const merged: Profile = {
          name,
          email,
          avatarUri: local.avatarUri || null,
        };

        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ ...local, ...merged, plan }));
        setProfile(merged);
        setNameInput(name);
      } catch (serverErr) {
        // Se o servidor falhar, mantém os dados locais já exibidos
        console.warn('getMe falhou, usando cache:', serverErr);
      }
    } catch (e) {
      console.error('loadProfile error:', e);
    }
  };

  const saveProfile = async (updated: Partial<Profile>) => {
    try {
      const merged = { ...profile, ...updated };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
      setProfile(merged);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    await saveProfile({ name: nameInput.trim() });
    setEditingName(false);
    setSaving(false);
    Toast.show({ type: 'success', text1: 'Nome atualizado!' });
  };

  const handlePickAvatar = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = async (e: any) => {
        const file: File = e.target.files?.[0];
        if (!file) return;

        // Preview local imediato
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUri = ev.target?.result as string;
          setProfile((prev) => ({ ...prev, avatarUri: dataUri }));
        };
        reader.readAsDataURL(file);

        // Upload para o backend
        try {
          const result = await api.uploadAvatar(file, file.name);
          const serverUri = result?.avatar_url || null;

          // Salva URL do servidor localmente
          await saveProfile({ avatarUri: serverUri || profile.avatarUri });
          Toast.show({ type: 'success', text1: 'Avatar atualizado!' });
        } catch (err: any) {
          Toast.show({ type: 'error', text1: 'Erro no upload', text2: err?.message });
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Foto de perfil',
        'Para adicionar foto no app mobile, instale o expo-image-picker e recompile o app.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpgrade = async () => {
    try {
      setSaving(true);
      const data = await api.upgradePlan('pro');
      // data = { checkout_url, bill_id }
      const url = data.checkout_url || 'https://app.abacatepay.com/pay/bill_AXHzZt3AftmAyBRQHaBxJqdc';
      const billId: string | null = data.bill_id ?? null;

      if (url) {
        setPaymentUrl(url);
        setPaymentBillId(billId);
        setShowPaymentModal(true);
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Erro no upgrade', text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await removeToken();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja sair da sua conta?')) doLogout();
    } else {
      Alert.alert('Sair', 'Deseja sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const initials = profile.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'IM';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Meu Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.content, animStyle]}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
        </View>

        {/* Name card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>INFORMAÇÕES PESSOAIS</Text>

          <View style={styles.field}>
            <View style={styles.fieldLeft}>
              <View style={styles.fieldIcon}>
                <Ionicons name="person-outline" size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldTitle}>Nome</Text>
                {editingName ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                    placeholderTextColor={Colors.textMuted}
                    placeholder="Seu nome"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {profile.name || 'Não definido'}
                  </Text>
                )}
              </View>
            </View>
            {editingName ? (
              <TouchableOpacity onPress={handleSaveName} disabled={saving}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setEditingName(true); setNameInput(profile.name); }}>
                <Ionicons name="pencil-outline" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <View style={styles.fieldLeft}>
              <View style={styles.fieldIcon}>
                <Ionicons name="mail-outline" size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldTitle}>E-mail</Text>
                <Text style={styles.fieldValue}>
                  {profile.email || 'Não definido'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Plan card */}
        <View style={[styles.card, styles.planCard]}>
          <View style={styles.planLeft}>
            <View style={styles.planIcon}>
              <Ionicons name="star" size={18} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.planTitle}>
                Plano {profile.plan === 'pro' ? 'PRO ⭐' : 'Free'}
              </Text>
              <Text style={styles.planSub}>
                {profile.plan === 'pro' ? 'Imóveis ilimitados' : 'Até 2 imóveis cadastrados'}
              </Text>
            </View>
          </View>
          {profile.plan !== 'pro' && (
            <TouchableOpacity 
              style={[styles.upgradeBtn, saving && { opacity: 0.7 }]} 
              onPress={handleUpgrade}
              disabled={saving}
            >
              <Text style={styles.upgradeBtnText}>
                {saving ? 'Aguarde...' : 'Upgrade'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </Animated.View>

      <PaymentModal
        visible={showPaymentModal}
        url={paymentUrl}
        billId={paymentBillId}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          Toast.show({
            type: 'success',
            text1: 'Pagamento concluído! 🎉',
            text2: 'Seu plano foi atualizado para PRO.',
          });
          loadProfile();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
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
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accent + '25',
    borderWidth: 2,
    borderColor: Colors.accent + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.accent + '50',
  },
  avatarInitials: {
    color: Colors.accent,
    fontSize: 32,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarHint: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  cardLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  fieldInput: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    paddingVertical: 2,
    minWidth: 140,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  planSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  upgradeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.accent,
  },
  upgradeBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.danger + '12',
    borderWidth: 1,
    borderColor: Colors.danger + '30',
    marginTop: 4,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
});
