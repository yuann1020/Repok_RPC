import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterBookingsAdminDto } from '../dto/filter-bookings.admin.dto';

@Injectable()
export class AdminBookingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBookings(filterDto: FilterBookingsAdminDto) {
    const { status, date, userId, courtId } = filterDto;
    const where: any = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.bookedAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (courtId) {
      // Filter if inherently any nested booking item intersects strictly the target court boundary mapping
      where.items = {
        some: { courtId },
      };
    }

    return this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        items: { include: { court: { select: { name: true } } } },
        payment: { select: { status: true, amount: true } },
      },
    });
  }

  async getBookingById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        items: { include: { court: true, availability: true } },
        payment: true,
      },
    });

    if (!booking)
      throw new NotFoundException('Deep booking data natively not fetched');
    return booking;
  }

  async deleteBookings(ids: string[]) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Get all bookings to release slots
      const bookings = await prisma.booking.findMany({
        where: { id: { in: ids } },
        include: { items: true },
      });

      const availabilityIds = bookings.flatMap((b) =>
        b.items.map((item) => item.availabilityId),
      );

      // 2. Release slots
      if (availabilityIds.length > 0) {
        await prisma.courtAvailability.updateMany({
          where: { id: { in: availabilityIds } },
          data: { isAvailable: true },
        });
      }

      // 3. Delete payments first if they exist (due to many-to-one or one-to-one)
      // Actually onDelete: Cascade should handle it if defined in schema, let's check schema again.
      // schema.prisma: model Payment { ... booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade) }
      // So deleting booking will delete payment.

      // 4. Delete bookings
      return prisma.booking.deleteMany({
        where: { id: { in: ids } },
      });
    });
  }

  async deleteAllBookings() {
    return this.prisma.$transaction(async (prisma) => {
      // Release all slots
      await prisma.courtAvailability.updateMany({
        data: { isAvailable: true },
      });

      return prisma.booking.deleteMany({});
    });
  }
}
