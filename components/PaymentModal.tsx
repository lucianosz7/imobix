import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Text,
  Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface PaymentModalProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentModal({
  visible,
  url,
  onClose,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    // Detectar sucesso ou cancelamento via URL (exemplo)
    if (navState.url.includes('/success')) {
      if (onSuccess) onSuccess();
      onClose();
    } else if (navState.url.includes('/cancel') || navState.url.includes('/error')) {
      if (onCancel) onCancel();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Pagamento Seguro</Text>
            <View style={styles.secureBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.accent} />
              <Text style={styles.secureText}>SSL</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* WebView Content */}
        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: url }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.loadingText}>Carregando checkout...</Text>
              </View>
            )}
            style={{ flex: 1, backgroundColor: Colors.primary }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  secureText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    gap: 16,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
