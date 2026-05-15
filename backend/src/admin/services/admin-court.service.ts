import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourtAdminDto } from '../dto/create-court.admin.dto';
import { UpdateCourtAdminDto } from '../dto/update-court.admin.dto';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

const COURTS_CACHE_PREFIX = 'courts:';

@Injectable()
export class AdminCourtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async createCourt(dto: CreateCourtAdminDto) {
    const court = await this.prisma.court.create({
      data: dto,
    });

    this.cache.deleteByPrefix(COURTS_CACHE_PREFIX);
    return court;
  }

  async updateCourt(id: string, dto: UpdateCourtAdminDto) {
    const check = await this.prisma.court.findUnique({ where: { id } });
    if (!check)
      throw new NotFoundException(
        'Court configuration natively not intercepted',
      );

    const court = await this.prisma.court.update({
      where: { id },
      data: dto,
    });

    this.cache.deleteByPrefix(COURTS_CACHE_PREFIX);
    return court;
  }
}
