import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(userId: string, createDto: CreateBookingDto) {
    const { availabilityIds } = createDto;

    // Process out raw duplicates naturally passed by external clients
    const uniqueSlotIds = [...new Set(availabilityIds)];

    const slots = await this.prisma.courtAvailability.findMany({
      where: { id: { in: uniqueSlotIds } },
      orderBy: { startTime: 'asc' },
    });

    if (slots.length !== uniqueSlotIds.length) {
      throw new BadRequestException(
        'One or more requested availability slots point to invalid records',
      );
    }

    const firstSlot = slots[0];
    const targetCourtId = firstSlot.courtId;

    let totalAmount = 0;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];

      // Assert native boundaries mapping securely
      if (slot.courtId !== targetCourtId) {
        throw new BadRequestException(
          'All booking slots must explicitly belong to the exact same continuous court',
        );
      }

      if (!slot.isAvailable) {
        throw new BadRequestException(
          'One or more required chronological blocks are no longer available for booking',
        );
      }

      totalAmount += Number(slot.basePrice || 0);

      // Strict consecutive link verification natively tracking the millisecond signatures tightly
      if (i > 0) {
        const previousSlot = slots[i - 1];
        if (previousSlot.endTime.getTime() !== slot.startTime.getTime()) {
          throw new BadRequestException(
            'All slots must be perfectly consecutive organically with no logic gaps',
          );
        }
      }
    }

    // Stakeholder Engine Constraints — convert UTC to local Malaysian time (UTC+8)
    const beginningHour = (firstSlot.startTime.getUTCHours() + 8) % 24;

    if (beginningHour >= 17 && slots.length < 2) {
      throw new BadRequestException(
        'Booking policies heavily stipulate that reservations spanning from 5:00 PM onward demand a minimum consecutive allocation of 2 hours.',
      );
    }

    // Deploy fully atomic Prisma Database Transaction organically
    return this.prisma.$transaction(async (prisma) => {
      const bookingReference = `REP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const booking = await prisma.booking.create({
        data: {
          userId,
          bookingReference,
          totalAmount,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
        },
      });

      const bookingItemInserts = slots.map((s) => ({
        bookingId: booking.id,
        courtId: s.courtId,
        availabilityId: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        price: s.basePrice || 0,
      }));

      await prisma.bookingItem.createMany({
        data: bookingItemInserts,
      });

      await prisma.courtAvailability.updateMany({
        where: { id: { in: uniqueSlotIds } },
        data: { isAvailable: false },
      });

      return await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { items: true },
      });
    });
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { bookedAt: 'desc' },
      include: {
        items: {
          include: { court: { select: { name: true } } },
        },
      },
    });
  }

  async getMyBookingById(userId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        items: {
          include: { court: true },
        },
      },
    });

    if (!booking)
      throw new NotFoundException('Booking strictly not located natively');
    if (booking.userId !== userId)
      throw new ForbiddenException(
        'You organically do not own access permissions spanning this strict resource',
      );

    return booking;
  }

  async cancelBooking(userId: string, id: string) {
    const booking = await this.getMyBookingById(userId, id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Targeted booking organically displays an active cancellation state already natively',
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      const availabilityIds = booking.items.map((item) => item.availabilityId);

      await prisma.courtAvailability.updateMany({
        where: { id: { in: availabilityIds } },
        data: { isAvailable: true },
      });

      return prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
    });
  }
}
