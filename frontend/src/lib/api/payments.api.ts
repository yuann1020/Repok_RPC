import { apiClient } from './api.client';

export const paymentsApi = {
  initiatePayment: async (bookingId: string) => {
    const response = await apiClient.post(`/payments/${bookingId}/initiate`);
    return response.data;
  },

  getPaymentForBooking: async (bookingId: string) => {
    const response = await apiClient.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  uploadProof: async (paymentId: string, proofImageUrl: string) => {
    const response = await apiClient.post(`/payments/${paymentId}/proof`, { proofImageUrl });
    return response.data;
  }
};
