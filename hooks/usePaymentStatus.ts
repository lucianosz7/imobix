import { useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

interface UsePaymentStatusOptions {
  /** AbacatePay bill ID returned from /billing/upgrade */
  billId: string | null;
  /** Called immediately when status becomes "paid" */
  onPaid: () => void;
  /** Called if polling stops without payment (timeout or explicit stop) */
  onFailed?: () => void;
  /** Poll interval in ms (default: 3000) */
  intervalMs?: number;
  /** Max polling duration in ms before giving up (default: 300000 = 5 min) */
  timeoutMs?: number;
}

/**
 * Polls GET /payment/status/:billId every `intervalMs` milliseconds.
 * Stops automatically when status is "paid", "failed", "expired", or timeout is hit.
 */
export function usePaymentStatus({
  billId,
  onPaid,
  onFailed,
  intervalMs = 3000,
  timeoutMs = 300_000,
}: UsePaymentStatusOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPaidRef = useRef(onPaid);
  const onFailedRef = useRef(onFailed);

  // Keep refs current so closures don't capture stale callbacks
  useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);
  useEffect(() => { onFailedRef.current = onFailed; }, [onFailed]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!billId) return;

    const poll = async () => {
      try {
        const status: PaymentStatus = await api.getPaymentStatus(billId);
        if (status === 'paid') {
          stopPolling();
          onPaidRef.current();
        } else if (status === 'failed' || status === 'expired') {
          stopPolling();
          onFailedRef.current?.();
        }
        // "pending" → keep polling
      } catch {
        // Network hiccup — keep polling silently
      }
    };

    // Kick off immediately, then repeat
    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    // Safety timeout so we don't poll forever
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      onFailedRef.current?.();
    }, timeoutMs);

    return () => stopPolling();
  }, [billId, intervalMs, timeoutMs, stopPolling]);

  return { stopPolling };
}
