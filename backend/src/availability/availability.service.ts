import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(query: QueryAvailabilityDto) {
    const { courtId, date, includeUnavailable } = query;
    const where: any = {};

    if (courtId) {
      where.courtId = courtId;
    }

    if (!includeUnavailable) {
      where.isAvailable = true; // By default only show available slots
    }

    if (date) {
      // Use local Malaysian time (UTC+8) boundaries so the selected calendar date
      // maps correctly: local midnight = previous day 16:00 UTC
      const startOfDay = new Date(`${date}T00:00:00+08:00`);
      const endOfDay = new Date(`${date}T23:59:59.999+08:00`);
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const slots = await this.prisma.courtAvailability.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    // JIT: Just-In-Time Auto Generation
    if (slots.length === 0 && courtId && date) {
      // Background generation for the requested empty day
      await this.createSlots({
        courtId,
        startDate: date,
        endDate: date,
      });

      // Refetch the newly created slots
      return this.prisma.courtAvailability.findMany({
        where,
        orderBy: { startTime: 'asc' },
      });
    }

    return slots;
  }

  async createSlots(dto: CreateAvailabilityDto) {
    const { courtId, startDate, endDate, basePrice } = dto;
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
    });
    if (!court) {
      throw new NotFoundException(`Court ${courtId} not found`);
    }

    const price = basePrice || Number(court.pricePerHour);

    const slots = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const year = currentDate.getUTCFullYear();
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getUTCDate()).padStart(2, '0');

      // Operating hours strictly from 8 AM to 12 AM (midnight) in local Malaysian time (UTC+8)
      for (let hour = 8; hour < 24; hour++) {
        const slotStart = new Date(
          `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:00:00+08:00`,
        );
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour consecutive block

        slots.push({
          courtId,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: true, // Slots are active and bookable by default
          basePrice: price,
        });
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const result = await this.prisma.courtAvailability.createMany({
      data: slots,
      skipDuplicates: true, // Native conflict resolution on the composite @@unique constraint
    });

    return {
      message: `Processed standard ${slots.length} generation loop.`,
      insertedCount: result.count,
    };
  }

  async updateAvailability(id: string, dto: UpdateAvailabilityDto) {
    const slot = await this.prisma.courtAvailability.findUnique({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException(`Slot ${id} not found`);
    }

    return this.prisma.courtAvailability.update({
      where: { id },
      data: { isAvailable: dto.isAvailable },
    });
  }
}
