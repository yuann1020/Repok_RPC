import { apiClient } from './api.client';

export interface AvailabilitySlot {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  basePrice: string | null;
}

export const availabilityApi = {
  getAvailability: async (courtId: string, date: string): Promise<AvailabilitySlot[]> => {
    const response = await apiClient.get('/availability', {
      params: { courtId, date }
    });
    return response.data;
  },

  generateSlots: async (payload: { courtId: string; startDate: string; endDate: string; basePrice?: string }) => {
    const response = await apiClient.post('/availability', payload);
    return response.data;
  },

  updateSlotStatus: async (id: string, isAvailable: boolean) => {
    const response = await apiClient.patch(`/availability/${id}`, { isAvailable });
    return response.data;
  }
};
