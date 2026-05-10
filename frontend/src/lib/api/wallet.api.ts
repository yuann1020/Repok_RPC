import { apiClient } from './api.client';

export type TopUpPackageCode = 'RM50' | 'RM100' | 'RM200' | 'RM500';
export type CreateStripeTopUpCheckoutPayload =
  | { packageCode: TopUpPackageCode; customAmount?: never }
  | { customAmount: number; packageCode?: never };

export interface WalletSummary {
  id: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'TOP_UP' | 'DEDUCTION' | 'REFUND' | 'ADJUSTMENT';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  reference: string | null;
  createdAt: string;
  booking?: { id: string; bookingReference: string } | null;
  topUpOrder?: {
    id: string;
    packageCode: string | null;
    isCustom: boolean;
    status: string;
    stripeSessionId: string | null;
  } | null;
}

export interface TopUpOrder {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  packageCode: string | null;
  isCustom: boolean;
  amountRm: number;
  credits: number;
  stripeSessionId: string | null;
  paidAt: string | null;
  createdAt: string;
  walletTransaction: {
    id: string;
    status: string;
    amount: number;
    balanceAfter: number;
    createdAt: string;
  } | null;
}

export const TOP_UP_PACKAGES: Array<{
  code: TopUpPackageCode;
  amountRm: number;
  credits: number;
  label: string;
}> = [
  { code: 'RM50', amountRm: 50, credits: 50, label: 'Starter' },
  { code: 'RM100', amountRm: 100, credits: 100, label: 'Standard' },
  { code: 'RM200', amountRm: 200, credits: 210, label: 'Plus' },
  { code: 'RM500', amountRm: 500, credits: 550, label: 'Club' },
];

export const walletApi = {
  getWallet: async (): Promise<WalletSummary> => {
    const response = await apiClient.get('/wallet');
    return response.data;
  },

  getTransactions: async (): Promise<WalletTransaction[]> => {
    const response = await apiClient.get('/wallet/transactions');
    return response.data;
  },

  createStripeTopUpCheckout: async (
    payload: CreateStripeTopUpCheckoutPayload,
  ) => {
    const response = await apiClient.post(
      '/wallet/top-ups/stripe-checkout',
      payload,
    );
    return response.data as {
      topUpOrderId: string;
      status: string;
      checkoutUrl: string;
    };
  },

  createStripeCheckout: async (packageCode: TopUpPackageCode) =>
    walletApi.createStripeTopUpCheckout({ packageCode }),

  getTopUpOrder: async (id: string): Promise<TopUpOrder> => {
    const response = await apiClient.get(`/wallet/top-ups/${id}`);
    return response.data;
  },
};
