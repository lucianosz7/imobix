import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PropertyType } from '../../mocks/properties';
import { TouchableOpacity } from 'react-native';
import { api } from '../../services/api';

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

export default function AddPropertyScreen() {
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

  const updateField = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.rent.trim()) newErrors.rent = 'Valor é obrigatório';
    else if (isNaN(parseFloat(form.rent))) newErrors.rent = 'Valor inválido';
    if (form.costs && isNaN(parseFloat(form.costs))) newErrors.costs = 'Valor inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const rentValue = parseFloat(form.rent) || 0;
      const costsValue = parseFloat(form.costs) || 0;
      
      const propResponse = await api.createProperty({
        name: form.name,
        type: form.type,
        rent_value: rentValue,
        is_rented: form.isRented,
        under_maintenance: form.underMaintenance,
      });

      // Se custos informados, salva como despesa vinculada
      if (costsValue > 0 && propResponse?.id) {
        await api.createExpense({
          property_id: propResponse.id,
          name: 'Custos Fixos',
          value: costsValue,
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: `"${form.name}" adicionado com sucesso!`,
      });
      
      router.replace('/(tabs)/properties');
    } catch (e: any) {
      // O erro já foi tratado globalmente pelo errorHandler (Toast)
    } finally {
      setLoading(false);
    }
  };

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
          <View>
            <Text style={styles.title}>Novo Imóvel</Text>
            <Text style={styles.subtitle}>Preencha os dados do imóvel</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="add-circle" size={22} color={Colors.accent} />
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
            label="Valor do aluguel (R$)"
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
          title="Adicionar imóvel"
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
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
  profitPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '12',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  profitPreviewText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  profitValue: {
    color: Colors.accent,
    fontWeight: '700',
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
