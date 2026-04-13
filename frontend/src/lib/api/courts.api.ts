import { apiClient } from './api.client';

// We abstract out the typings natively matching our backend Prisma Schema natively.
export interface Court {
  id: string;
  name: string;
  category: "STANDARD" | "CHAMPIONSHIP";
  pricePerHour: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  courtType: "INDOOR" | "OUTDOOR";
  facilities: string[];
  imageUrl?: string;
}

export const courtsApi = {
  // Pass an optional explicit generic filter securely configuring URLSearchParams natively
  getAllCourts: async (filters?: { category?: string; status?: string }): Promise<Court[]> => {
    const response = await apiClient.get('/courts', { params: filters });
    return response.data;
  },

  // Deep extract specifically bound court profiles flawlessly 
  getCourtById: async (id: string): Promise<Court> => {
    const response = await apiClient.get(`/courts/${id}`);
    return response.data;
  }
};
