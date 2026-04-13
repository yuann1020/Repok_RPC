import { apiClient } from './api.client';
import { Announcement, AnnouncementType } from './announcements.api';
import { Court } from './courts.api';

// Safely excluding internal UUID constraints organically generating payloads
export type CreateCourtPayload = Omit<Court, 'id'>;
export type UpdateCourtPayload = Partial<CreateCourtPayload>;
export interface AdminAnnouncement extends Announcement {
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  imageUrls: string[];
  startsAt?: string;
  endsAt?: string;
}

export type UpdateAnnouncementPayload = Partial<CreateAnnouncementPayload>;

export const adminApi = {
  // --- Admin Users ---
  getAllUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  getAllAnnouncements: async (): Promise<AdminAnnouncement[]> => {
    const response = await apiClient.get('/admin/announcements');
    return response.data;
  },

  createAnnouncement: async (payload: CreateAnnouncementPayload): Promise<AdminAnnouncement> => {
    const response = await apiClient.post('/admin/announcements', payload);
    return response.data;
  },

  updateAnnouncement: async ({ id, payload }: { id: string; payload: UpdateAnnouncementPayload }): Promise<AdminAnnouncement> => {
    const response = await apiClient.patch(`/admin/announcements/${id}`, payload);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<AdminAnnouncement> => {
    const response = await apiClient.delete(`/admin/announcements/${id}`);
    return response.data;
  },

  createCourt: async (payload: CreateCourtPayload): Promise<Court> => {
    const response = await apiClient.post('/admin/courts', payload);
    return response.data;
  },
  
  updateCourt: async ({ id, payload }: { id: string; payload: UpdateCourtPayload }): Promise<Court> => {
    const response = await apiClient.patch(`/admin/courts/${id}`, payload);
    return response.data;
  },

  // --- Admin Bookings ---
  getAllBookings: async (filters?: { status?: string; date?: string; userId?: string; courtId?: string }) => {
    const response = await apiClient.get('/admin/bookings', { params: filters });
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await apiClient.get(`/admin/bookings/${id}`);
    return response.data;
  },

  bulkDeleteBookings: async (ids: string[]) => {
    const response = await apiClient.post('/admin/bookings/bulk-delete', { ids });
    return response.data;
  },

  deleteAllBookings: async () => {
    const response = await apiClient.delete('/admin/bookings/all');
    return response.data;
  },

  // --- Admin Payments ---
  getAllPayments: async (filters?: { status?: string }) => {
    const response = await apiClient.get('/admin/payments', { params: filters });
    return response.data;
  },

  getPaymentById: async (id: string) => {
    const response = await apiClient.get(`/admin/payments/${id}`);
    return response.data;
  },

  getPaymentByBookingId: async (bookingId: string) => {
    const response = await apiClient.get(`/admin/payments/booking/${bookingId}`);
    return response.data;
  },

  reviewPayment: async (paymentId: string, status: 'PAID' | 'FAILED') => {
    const response = await apiClient.post(`/admin/payments/${paymentId}/review`, { status });
    return response.data;
  },

  bulkDeletePayments: async (ids: string[]) => {
    const response = await apiClient.post('/admin/payments/bulk-delete', { ids });
    return response.data;
  },

  deleteAllPayments: async () => {
    const response = await apiClient.post('/admin/payments/delete-all');
    return response.data;
  }
};
