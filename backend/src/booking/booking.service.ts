import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';

const DEFAULT_BOOKING_HOLD_MINUTES = 10;
const BOOKING_EXPIRED_MESSAGE =
  'This booking has expired. Please select slots again.';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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

    return this.prisma.$transaction(async (prisma) => {
      const claimedSlots = await prisma.courtAvailability.updateMany({
        where: { id: { in: uniqueSlotIds }, isAvailable: true },
        data: { isAvailable: false },
      });

      if (claimedSlots.count !== uniqueSlotIds.length) {
        throw new BadRequestException(
          'One or more required chronological blocks are no longer available for booking',
        );
      }

      const bookingReference = `REP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const expiresAt = this.getBookingExpiresAt();

      const booking = await prisma.booking.create({
        data: {
          userId,
          bookingReference,
          totalAmount,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          expiresAt,
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

      return await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { items: true },
      });
    });
  }

  async getMyBookings(userId: string) {
    await this.expireUnpaidBookings({ userId });

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
    await this.expireUnpaidBookings({ bookingId: id, userId });

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

  async payWithWallet(userId: string, id: string) {
    if (await this.expireBookingIfNeeded(id, userId)) {
      throw new BadRequestException(BOOKING_EXPIRED_MESSAGE);
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking strictly not located natively');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException(
        'You organically do not own access permissions spanning this strict resource',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bookings cannot be paid');
    }

    if (booking.status === BookingStatus.EXPIRED) {
      throw new BadRequestException(BOOKING_EXPIRED_MESSAGE);
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Booking is already paid');
    }

    const amount = new Prisma.Decimal(booking.totalAmount);
    const now = new Date();

    return this.prisma.$transaction(async (prisma) => {
      const wallet = await prisma.wallet.upsert({
        where: { userId },
        create: { userId, balance: new Prisma.Decimal(0), currency: 'MYR' },
        update: {},
      });

      const bookingUpdate = await prisma.booking.updateMany({
        where: {
          id,
          userId,
          paymentStatus: { not: PaymentStatus.PAID },
          status: BookingStatus.PENDING,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: BookingStatus.CONFIRMED,
        },
      });

      if (bookingUpdate.count === 0) {
        throw new BadRequestException(BOOKING_EXPIRED_MESSAGE);
      }

      const debit = await prisma.wallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });

      if (debit.count === 0) {
        const shortfall = amount.sub(wallet.balance);
        throw new BadRequestException({
          message: 'Insufficient wallet balance',
          walletBalance: Number(wallet.balance),
          requiredCredits: Number(amount),
          shortfall: Number(shortfall.gt(0) ? shortfall : new Prisma.Decimal(0)),
        });
      }

      const updatedWallet = await prisma.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });
      const balanceAfter = updatedWallet.balance;
      const balanceBefore = balanceAfter.add(amount);

      const walletTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          bookingId: id,
          type: WalletTransactionType.DEDUCTION,
          status: WalletTransactionStatus.SUCCESS,
          amount: amount.negated(),
          balanceBefore,
          balanceAfter,
          description: `Booking payment ${booking.bookingReference}`,
          reference: booking.bookingReference,
        },
      });

      const payment = await prisma.payment.upsert({
        where: { bookingId: id },
        create: {
          bookingId: id,
          paymentProvider: 'WALLET',
          amount,
          currency: 'MYR',
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
        update: {
          paymentProvider: 'WALLET',
          amount,
          currency: 'MYR',
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          proofImageUrl: null,
        },
      });

      return {
        booking: await prisma.booking.findUnique({
          where: { id },
          include: {
            items: { include: { court: true } },
          },
        }),
        payment,
        walletBalance: Number(balanceAfter),
        walletTransaction: {
          ...walletTransaction,
          amount: Number(walletTransaction.amount),
          balanceBefore: Number(walletTransaction.balanceBefore),
          balanceAfter: Number(walletTransaction.balanceAfter),
        },
      };
    });
  }

  async expireBookingIfNeeded(id: string, userId?: string) {
    const result = await this.expireUnpaidBookings({ bookingId: id, userId });
    return result.expiredCount > 0;
  }

  async expireUnpaidBookings(scope: { bookingId?: string; userId?: string } = {}) {
    const now = new Date();
    const where: Prisma.BookingWhereInput = {
      status: BookingStatus.PENDING,
      expiresAt: { lte: now },
      paymentStatus: { not: PaymentStatus.PAID },
      ...(scope.bookingId ? { id: scope.bookingId } : {}),
      ...(scope.userId ? { userId: scope.userId } : {}),
    };

    const staleBookings = await this.prisma.booking.findMany({
      where,
      select: {
        id: true,
        items: { select: { availabilityId: true } },
      },
    });

    const expiredIds: string[] = [];

    for (const booking of staleBookings) {
      const didExpire = await this.prisma.$transaction(async (prisma) => {
        const updated = await prisma.booking.updateMany({
          where: {
            id: booking.id,
            status: BookingStatus.PENDING,
            expiresAt: { lte: now },
            paymentStatus: { not: PaymentStatus.PAID },
          },
          data: {
            status: BookingStatus.EXPIRED,
            paymentStatus: PaymentStatus.EXPIRED,
            expiredAt: now,
          },
        });

        if (updated.count === 0) {
          return false;
        }

        await prisma.payment.updateMany({
          where: {
            bookingId: booking.id,
            status: { not: PaymentStatus.PAID },
          },
          data: { status: PaymentStatus.EXPIRED },
        });

        const availabilityIds = booking.items.map((item) => item.availabilityId);
        if (availabilityIds.length > 0) {
          await prisma.courtAvailability.updateMany({
            where: { id: { in: availabilityIds } },
            data: { isAvailable: true },
          });
        }

        return true;
      });

      if (didExpire) {
        expiredIds.push(booking.id);
      }
    }

    return {
      expiredCount: expiredIds.length,
      bookingIds: expiredIds,
    };
  }

  private getBookingExpiresAt() {
    return new Date(Date.now() + this.getBookingHoldMinutes() * 60 * 1000);
  }

  private getBookingHoldMinutes() {
    const configured = Number(
      this.configService.get<string>('BOOKING_HOLD_MINUTES'),
    );

    if (!Number.isFinite(configured) || configured <= 0) {
      return DEFAULT_BOOKING_HOLD_MINUTES;
    }

    return Math.floor(configured);
  }
}
