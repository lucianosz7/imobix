import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Text,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { usePaymentStatus } from '../hooks/usePaymentStatus';

interface PaymentModalProps {
  visible: boolean;
  /** AbacatePay checkout URL */
  url: string;
  /**
   * AbacatePay bill ID (e.g. "bill_xxx") used to poll /payment/status/:billId.
   * If null, polling is disabled and only URL-change detection is used.
   */
  billId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentModal({
  visible,
  url,
  billId,
  onClose,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  // ─── Polling ───────────────────────────────────────────────────────────────
  const handlePaid = useCallback(() => {
    setPaid(true);
    // Small delay so the success overlay is visible before the modal closes
    setTimeout(() => {
      setPaid(false);
      onSuccess?.();
      onClose();
    }, 1200);
  }, [onSuccess, onClose]);

  // Polling is active only while the modal is open and we have a billId
  usePaymentStatus({
    billId: visible ? billId : null,
    onPaid: handlePaid,
  });

  // ─── WebView URL fallback ──────────────────────────────────────────────────
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (navState.url.includes('/success')) {
      handlePaid();
    } else if (navState.url.includes('/cancel') || navState.url.includes('/error')) {
      onCancel?.();
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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={paid}>
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

        {/* ── Success overlay ── shown briefly when payment is confirmed */}
        {paid && (
          <View style={styles.successOverlay}>
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={42} color="#fff" />
              </View>
              <Text style={styles.successTitle}>Pagamento confirmado!</Text>
              <Text style={styles.successSub}>Seu plano será atualizado em instantes.</Text>
            </View>
          </View>
        )}
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
  // ── Success overlay ──
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 14,
    width: '78%',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  successTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSub: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
