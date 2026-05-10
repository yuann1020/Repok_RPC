import { apiClient } from './api.client';

export interface CreateBookingDto {
  availabilityIds: string[];
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'EXPIRED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PENDING_REVIEW'
  | 'EXPIRED';

export interface Booking {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string | number;
  bookedAt: string;
  expiresAt?: string | null;
  expiredAt?: string | null;
  items: Array<{
    id: string;
    startTime: string;
    endTime: string;
    price: string | number;
    court?: { name?: string } | null;
  }>;
}

export const bookingsApi = {
  createBooking: async (payload: CreateBookingDto): Promise<Booking> => {
    const response = await apiClient.post('/bookings', payload);
    return response.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings');
    return response.data;
  },

  cancelBooking: async (id: string) => {
    const response = await apiClient.patch(`/bookings/${id}/cancel`);
    return response.data;
  },

  payWithWallet: async (id: string) => {
    const response = await apiClient.post(`/bookings/${id}/pay-with-wallet`);
    return response.data;
  }
};
