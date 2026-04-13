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

export const announcementsApi = {
  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    const response = await apiClient.get('/announcements');
    return response.data;
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
    return response.data;
  }
};
