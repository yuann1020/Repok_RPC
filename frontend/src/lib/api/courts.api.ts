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

function normalizeCourtArray(payload: unknown): Court[] {
  if (Array.isArray(payload)) return payload as Court[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  const arrayKeys = ['data', 'items', 'results', 'courts'];

  for (const key of arrayKeys) {
    const value = record[key];
    if (Array.isArray(value)) return value as Court[];
  }

  if (record.data && typeof record.data === 'object') {
    return normalizeCourtArray(record.data);
  }

  return [];
}

export const courtsApi = {
  // Pass an optional explicit generic filter securely configuring URLSearchParams natively
  getAllCourts: async (filters?: { category?: string; status?: string }): Promise<Court[]> => {
    const response = await apiClient.get('/courts', { params: filters });
    return normalizeCourtArray(response.data);
  },

  // Deep extract specifically bound court profiles flawlessly 
  getCourtById: async (id: string): Promise<Court> => {
    const response = await apiClient.get(`/courts/${id}`);
    return response.data;
  }
};
