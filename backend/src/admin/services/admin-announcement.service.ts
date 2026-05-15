import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementAdminDto } from '../dto/create-announcement.admin.dto';
import { UpdateAnnouncementAdminDto } from '../dto/update-announcement.admin.dto';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

const ANNOUNCEMENTS_CACHE_PREFIX = 'announcements:';

@Injectable()
export class AdminAnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

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

    const announcement = await this.prisma.announcement.create({
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

    this.cache.deleteByPrefix(ANNOUNCEMENTS_CACHE_PREFIX);
    return announcement;
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementAdminDto) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    this.validateDateWindow(dto.startsAt, dto.endsAt);

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type,
        isActive: dto.isActive,
        imageUrls: dto.imageUrls,
        startsAt: dto.startsAt
          ? new Date(dto.startsAt)
          : dto.startsAt === null
            ? null
            : undefined,
        endsAt: dto.endsAt
          ? new Date(dto.endsAt)
          : dto.endsAt === null
            ? null
            : undefined,
      },
    });

    this.cache.deleteByPrefix(ANNOUNCEMENTS_CACHE_PREFIX);
    return announcement;
  }

  async deleteAnnouncement(id: string) {
    try {
      const announcement = await this.prisma.announcement.delete({
        where: { id },
      });

      this.cache.deleteByPrefix(ANNOUNCEMENTS_CACHE_PREFIX);
      return announcement;
    } catch {
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
