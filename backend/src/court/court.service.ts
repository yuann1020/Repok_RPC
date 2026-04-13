import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetCourtsFilterDto } from './dto/get-courts-filter.dto';

@Injectable()
export class CourtService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filterDto: GetCourtsFilterDto) {
    const { category, status } = filterDto;

    return this.prisma.court.findMany({
      where: {
        ...(category && { category }),
        ...(status && { status }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const court = await this.prisma.court.findUnique({
      where: { id },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    return court;
  }
}
