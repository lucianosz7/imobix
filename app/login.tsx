import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { api, setToken } from '../services/api';

export default function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });

  // Animation shared values
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-30);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(40);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoTranslateY.value = withSpring(0, { damping: 18, stiffness: 100 });
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(300, withSpring(0, { damping: 18, stiffness: 100 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const validate = (): boolean => {
    const newErrors = { name: '', email: '', password: '' };
    let valid = true;

    if (isRegistering && !name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!email.includes('@')) {
      newErrors.email = 'Email inválido';
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter ao menos 6 caracteres';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (isRegistering) {
        // Register flow
        await api.register({
          name,
          email,
          password,
          plan: 'free',
        });
        Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login.');
        setIsRegistering(false);
        setPassword('');
      } else {
        // Login flow
        const data = await api.login({ email, password });
        if (data.token) {
          await setToken(data.token);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      // O erro já foi tratado globalmente pelo errorHandler mostrando o Toast
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.decoration1} />
        <View style={styles.decoration2} />

        <Animated.View style={[styles.logoSection, logoStyle]}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.logoText}>Imobix</Text>
          <Text style={styles.tagline}>Gestão inteligente de imóveis</Text>
        </Animated.View>

        <Animated.View style={[styles.formCard, formStyle]}>
          <Text style={styles.welcomeTitle}>
            {isRegistering ? 'Criar Conta' : 'Bem-vindo de volta'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isRegistering
              ? 'Preencha seus dados para começar'
              : 'Acesse sua conta para gerenciar seus imóveis'}
          </Text>

          <View style={styles.form}>
            {isRegistering && (
              <Input
                label="Nome"
                placeholder="Seu nome"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors((e) => ({ ...e, name: '' }));
                }}
                autoCapitalize="words"
                leftIcon="person-outline"
                error={errors.name}
              />
            )}

            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
            />

            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: '' }));
              }}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.password}
            />

            {!isRegistering && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Esqueci a senha</Text>
              </TouchableOpacity>
            )}

            <Button
              title={isRegistering ? 'Cadastrar' : 'Entrar'}
              onPress={handleSubmit}
              loading={loading}
              style={[styles.loginBtn, isRegistering && { marginTop: 14 }]}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.createAccountBtn}
              onPress={() => {
                setIsRegistering(!isRegistering);
                setErrors({ name: '', email: '', password: '' });
                setPassword('');
              }}
            >
              <Text style={styles.createAccountText}>
                {isRegistering ? 'Já tem conta? ' : 'Não tem conta? '}
                <Text style={styles.createAccountLink}>
                  {isRegistering ? 'Entrar' : 'Criar conta'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.footer, formStyle]}>
          <Text style={styles.footerText}>
            Ao {isRegistering ? 'cadastrar' : 'entrar'}, você concorda com nossos{' '}
            <Text style={styles.footerLink}>Termos de Uso</Text>
          </Text>
        </Animated.View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decoration1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accent + '08',
    top: -80,
    right: -80,
  },
  decoration2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent + '06',
    bottom: 50,
    left: -60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.accent + '40',
  },
  logoText: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  welcomeTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 20,
  },
  form: {
    gap: 0,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  forgotText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  createAccountBtn: {
    alignItems: 'center',
  },
  createAccountText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  createAccountLink: {
    color: Colors.accent,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.accent,
  },
});
