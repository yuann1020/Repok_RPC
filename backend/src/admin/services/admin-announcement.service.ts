import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementAdminDto } from '../dto/create-announcement.admin.dto';
import { UpdateAnnouncementAdminDto } from '../dto/update-announcement.admin.dto';

@Injectable()
export class AdminAnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async createAnnouncement(userId: string, dto: CreateAnnouncementAdminDto) {
    this.validateDateWindow(dto.startsAt, dto.endsAt);

    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type,
        isActive: dto.isActive,
        imageUrls: dto.imageUrls || [],
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        createdByUserId: userId,
      },
    });
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementAdminDto) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    this.validateDateWindow(dto.startsAt, dto.endsAt);

    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type,
        isActive: dto.isActive,
        imageUrls: dto.imageUrls,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : dto.startsAt === null ? null : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : dto.endsAt === null ? null : undefined,
      },
    });
  }

  async deleteAnnouncement(id: string) {
    try {
      return await this.prisma.announcement.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Announcement not found');
    }
  }

  private validateDateWindow(
    startsAt?: string | Date | null,
    endsAt?: string | Date | null,
  ) {
    if (!startsAt || !endsAt) {
      return;
    }

    const startDate = startsAt instanceof Date ? startsAt : new Date(startsAt);
    const endDate = endsAt instanceof Date ? endsAt : new Date(endsAt);

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'Announcement end date must be after the start date',
      );
    }
  }
}
