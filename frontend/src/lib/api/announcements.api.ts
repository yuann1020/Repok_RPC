import { apiClient } from './api.client';

export type AnnouncementType = 'INFO' | 'MAINTENANCE' | 'CLOSURE';

export interface Comment {
  id: string;
  announcementId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    fullName: string;
    profileImageUrl?: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  startsAt?: string;
  endsAt?: string;
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export function normalizeArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  const arrayKeys = ['data', 'items', 'results', 'announcements', 'comments'];

  for (const key of arrayKeys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (record.data && typeof record.data === 'object') {
    return normalizeArrayResponse<T>(record.data);
  }

  return [];
}

export function normalizeAnnouncement<T extends Announcement>(raw: T): T {
  return {
    ...raw,
    imageUrls: Array.isArray(raw.imageUrls)
      ? raw.imageUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      : [],
  };
}

export const announcementsApi = {
  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    const response = await apiClient.get('/announcements');
    return normalizeArrayResponse<Announcement>(response.data).map(normalizeAnnouncement);
  },

  getAnnouncementById: async (id: string): Promise<Announcement> => {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data;
  },

  addComment: async (id: string, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/announcements/${id}/comments`, { content });
    return response.data;
  },

  getComments: async (id: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/announcements/${id}/comments`);
    return normalizeArrayResponse<Comment>(response.data);
  }
};
