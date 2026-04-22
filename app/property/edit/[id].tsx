import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { PropertyType } from '../../../mocks/properties';
import { api } from '../../../services/api';
import Toast from 'react-native-toast-message';

const PROPERTY_TYPES: PropertyType[] = [
  'Apartamento',
  'Casa',
  'Sala Comercial',
  'Galpão',
  'Studio',
];

interface FormData {
  name: string;
  type: PropertyType;
  rent: string;
  costs: string;
  isRented: boolean;
  underMaintenance: boolean;
}

interface FormErrors {
  name?: string;
  rent?: string;
  costs?: string;
}

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [form, setForm] = useState<FormData>({
    name: '',
    type: 'Apartamento',
    rent: '',
    costs: '',
    isRented: false,
    underMaintenance: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const data = await api.getPropertyById(id);
      setForm({
        name: data.name || '',
        type: data.type || 'Apartamento',
        rent: data.rent_value ? data.rent_value.toString() : '',
        costs: data.costs ? data.costs.toString() : '',
        isRented: data.is_rented || false,
        underMaintenance: data.under_maintenance || false,
      });
    } catch (e) {
      // Global error handler will deal with visually
      router.back();
    } finally {
      setFetching(false);
    }
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (form.rent && isNaN(parseFloat(form.rent))) newErrors.rent = 'Valor inválido';
    if (form.costs && isNaN(parseFloat(form.costs))) newErrors.costs = 'Valor inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const rentValue = parseFloat(form.rent) || 0;
      
      await api.updateProperty(id, {
        name: form.name,
        type: form.type,
        rent_value: rentValue,
        is_rented: form.isRented,
        under_maintenance: form.underMaintenance,
      });

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Imóvel atualizado com sucesso!',
      });
      
      router.back(); // Volta para a tela de detalhes que irá recarregar
    } catch (e: any) {
      // Erro visual via Toast global
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textMuted }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.title}>Editar Imóvel</Text>
            <Text style={styles.subtitle}>Altere as informações abaixo</Text>
          </View>
        </View>

        {/* Form section: Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações básicas</Text>

          <Input
            label="Nome do imóvel"
            placeholder="Ex: Apto Centro 101"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            leftIcon="home-outline"
            error={errors.name}
          />

          <Input
            label="Endereço"
            placeholder="Rua, número, bairro, cidade"
            value={form.address}
            onChangeText={(v) => updateField('address', v)}
            leftIcon="location-outline"
            error={errors.address}
          />

          {/* Type selector */}
          <Text style={styles.label}>Tipo de imóvel</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScrollView}
            contentContainerStyle={styles.typeList}
          >
            {PROPERTY_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                onPress={() => setForm((f) => ({ ...f, type: t }))}
              >
                <Ionicons
                  name={
                    t === 'Apartamento'
                      ? 'business-outline'
                      : t === 'Casa'
                      ? 'home-outline'
                      : t === 'Sala Comercial'
                      ? 'briefcase-outline'
                      : t === 'Studio'
                      ? 'bed-outline'
                      : 'cube-outline'
                  }
                  size={16}
                  color={form.type === t ? Colors.accent : Colors.muted}
                />
                <Text
                  style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form section: Financeiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados financeiros</Text>

          <Input
            label="Valor do aluguel atual (R$)"
            placeholder="3.500,00"
            value={form.rent}
            onChangeText={(v) => updateField('rent', v)}
            leftIcon="cash-outline"
            keyboardType="decimal-pad"
            error={errors.rent}
          />

          <Input
            label="Custos fixos mensais (R$)"
            placeholder="600,00"
            value={form.costs}
            onChangeText={(v) => updateField('costs', v)}
            leftIcon="trending-down-outline"
            keyboardType="decimal-pad"
            error={errors.costs}
          />

          {/* Preview profit */}
          {form.rent && !isNaN(parseFloat(form.rent)) && form.costs && !isNaN(parseFloat(form.costs)) && (
            <View style={styles.profitPreview}>
              <Ionicons name="calculator-outline" size={16} color={Colors.accent} />
              <Text style={styles.profitPreviewText}>
                Lucro estimado:{' '}
                <Text style={styles.profitValue}>
                  R$ {(parseFloat(form.rent) - parseFloat(form.costs)).toFixed(2).replace('.', ',')}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Form section: Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setForm((f) => ({ ...f, isRented: !f.isRented }))}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="key-outline" size={18} color={Colors.accent} />
              <View>
                <Text style={styles.toggleLabel}>Alugado</Text>
                <Text style={styles.toggleSub}>Imóvel possui inquilino ativo</Text>
              </View>
            </View>
            <View style={[styles.toggleIndicator, form.isRented && styles.toggleIndicatorOn]}>
              <View style={[styles.toggleDot, form.isRented && styles.toggleDotOn]} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setForm((f) => ({ ...f, underMaintenance: !f.underMaintenance }))}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="construct-outline" size={18} color={Colors.warning} />
              <View>
                <Text style={styles.toggleLabel}>Em manutenção</Text>
                <Text style={styles.toggleSub}>Imóvel temporariamente indisponível</Text>
              </View>
            </View>
            <View style={[styles.toggleIndicator, form.underMaintenance && styles.toggleIndicatorWarning]}>
              <View style={[styles.toggleDot, form.underMaintenance && styles.toggleDotOn]} />
            </View>
          </TouchableOpacity>
        </View>

        <Button
          title="Salvar alterações"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  section: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 0,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  typeScrollView: {
    marginBottom: 8,
  },
  typeList: {
    gap: 8,
    paddingBottom: 4,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.accent + '18',
    borderColor: Colors.accent,
  },
  typeChipText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: Colors.accent,
  },
  submitBtn: {
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggleIndicator: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleIndicatorOn: {
    backgroundColor: Colors.accent + '30',
    borderColor: Colors.accent,
  },
  toggleIndicatorWarning: {
    backgroundColor: Colors.warning + '30',
    borderColor: Colors.warning,
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.muted,
  },
  toggleDotOn: {
    backgroundColor: Colors.accent,
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
});
