import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetCourtsFilterDto } from './dto/get-courts-filter.dto';
import { TtlCacheService } from '../common/cache/ttl-cache.service';

const COURTS_CACHE_PREFIX = 'courts:';
const COURTS_LIST_TTL_MS = 60_000;

@Injectable()
export class CourtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async findAll(filterDto: GetCourtsFilterDto) {
    const { category, status } = filterDto;
    const cacheKey = `${COURTS_CACHE_PREFIX}list:${category || 'all'}:${status || 'all'}`;

    return this.cache.getOrSet(cacheKey, COURTS_LIST_TTL_MS, () =>
      this.prisma.court.findMany({
        where: {
          ...(category && { category }),
          ...(status && { status }),
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          pricePerHour: true,
          status: true,
          courtType: true,
          category: true,
          facilities: true,
        },
      }),
    );
  }

  async findOne(id: string) {
    const court = await this.prisma.court.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        pricePerHour: true,
        status: true,
        courtType: true,
        category: true,
        facilities: true,
      },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    return court;
  }
}
