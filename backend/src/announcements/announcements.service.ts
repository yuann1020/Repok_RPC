import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

export interface PublicAnnouncementRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, userId: string) {
    return this.prisma.announcement.create({
      data: {
        ...createAnnouncementDto,
        createdByUserId: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { fullName: true, email: true },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { fullName: true, profileImageUrl: true },
            },
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async getActiveAnnouncements() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isActive: true,
        imageUrls: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    await this.findOne(id); // Ensure it exists

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...updateAnnouncementDto,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure it exists
    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  // --- COMMENT LOGIC ---
  async addComment(announcementId: string, userId: string, content: string) {
    await this.findOne(announcementId); // Verify announcement exists
    return this.prisma.comment.create({
      data: {
        content,
        announcementId,
        userId,
      },
      include: {
        user: {
          select: { fullName: true, profileImageUrl: true },
        },
      },
    });
  }

  async getComments(announcementId: string) {
    return this.prisma.comment.findMany({
      where: { announcementId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, profileImageUrl: true },
        },
      },
    });
  }
}
