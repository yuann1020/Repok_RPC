import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourtAdminDto } from '../dto/create-court.admin.dto';
import { UpdateCourtAdminDto } from '../dto/update-court.admin.dto';

@Injectable()
export class AdminCourtService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourt(dto: CreateCourtAdminDto) {
    return this.prisma.court.create({
      data: dto,
    });
  }

  async updateCourt(id: string, dto: UpdateCourtAdminDto) {
    const check = await this.prisma.court.findUnique({ where: { id } });
    if (!check)
      throw new NotFoundException(
        'Court configuration natively not intercepted',
      );

    return this.prisma.court.update({
      where: { id },
      data: dto,
    });
  }
}
