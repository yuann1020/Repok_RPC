import { apiClient } from './api.client';

export interface CreateBookingDto {
  availabilityIds: string[];
}

export const bookingsApi = {
  createBooking: async (payload: CreateBookingDto) => {
    const response = await apiClient.post('/bookings', payload);
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get('/bookings');
    return response.data;
  },

  cancelBooking: async (id: string) => {
    const response = await apiClient.patch(`/bookings/${id}/cancel`);
    return response.data;
  }
};
