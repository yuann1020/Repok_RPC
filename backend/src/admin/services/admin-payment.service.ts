import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterPaymentsAdminDto } from '../dto/filter-payments.admin.dto';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import { EmailService } from '../../email/email.service';

@Injectable()
export class AdminPaymentService {
  private readonly logger = new Logger(AdminPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getAllPayments(filterDto: FilterPaymentsAdminDto) {
    const where = filterDto.status ? { status: filterDto.status } : {};
    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingId: true,
        paymentProvider: true,
        paymentIntentId: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        proofImageUrl: true,
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            user: { select: { email: true, fullName: true } },
          },
        },
      },
    });
  }

  async getPaymentSummary() {
    const counts = await this.prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const countsByStatus = counts.reduce(
      (acc, item) => ({
        ...acc,
        [item.status]: item._count._all,
      }),
      {} as Record<string, number>,
    );

    return {
      countsByStatus,
      pendingReviewCount: countsByStatus[PaymentStatus.PENDING_REVIEW] || 0,
    };
  }

  async getPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        bookingId: true,
        paymentProvider: true,
        paymentIntentId: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        proofImageUrl: true,
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
    if (!payment)
      throw new NotFoundException(
        'Tracking payment struct dynamically invalid',
      );
    return payment;
  }

  async getPaymentByBookingId(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      select: {
        id: true,
        bookingId: true,
        paymentProvider: true,
        paymentIntentId: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        proofImageUrl: true,
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
    if (!payment)
      throw new NotFoundException(
        'Targeted booking lacks a tracked financial mapping securely',
      );
    return payment;
  }

  async reviewPayment(
    id: string,
    payload: { decision: 'APPROVE' | 'REJECT'; adminNote?: string },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            notes: true,
            confirmationEmailSentAt: true,
            totalAmount: true,
            user: { select: { email: true, fullName: true } },
            items: {
              select: {
                startTime: true,
                endTime: true,
                court: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!payment)
      throw new NotFoundException('Payment record not securely located');

    if (payment.booking.status === BookingStatus.EXPIRED) {
      throw new NotFoundException(
        'This booking has expired and cannot be approved.',
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new NotFoundException('This payment is already approved.');
    }

    const status =
      payload.decision === 'APPROVE'
        ? PaymentStatus.PAID
        : PaymentStatus.FAILED;

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status,
          paidAt: status === PaymentStatus.PAID ? new Date() : null,
        },
      });

      const updatedBooking = await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: status,
          status:
            status === PaymentStatus.PAID
              ? BookingStatus.CONFIRMED
              : payment.booking.status, // Keep pending if rejected, let expiry handle it
          notes: payload.adminNote || payment.booking.notes,
        },
      });

      return { updatedPayment, updatedBooking };
    });

    if (
      status === PaymentStatus.PAID &&
      !payment.booking.confirmationEmailSentAt &&
      payment.booking.user
    ) {
      try {
        const firstItem = payment.booking.items[0];
        const lastItem =
          payment.booking.items[payment.booking.items.length - 1];

        await this.emailService.sendBookingConfirmationEmail({
          email: payment.booking.user.email,
          customerName: payment.booking.user.fullName || 'Customer',
          bookingReference: payment.booking.bookingReference,
          courtName: firstItem?.court?.name || 'Pickleball Court',
          bookingDate:
            firstItem?.startTime.toISOString().split('T')[0] || 'TBD',
          startTime: firstItem?.startTime.toISOString() || 'TBD',
          endTime: lastItem?.endTime.toISOString() || 'TBD',
          totalAmount: Number(payment.booking.totalAmount).toFixed(2),
          paymentMethod: 'Manual QR Payment',
          bookingId: payment.booking.id,
        });

        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { confirmationEmailSentAt: new Date() },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send confirmation email for booking ${payment.bookingId}`,
          error,
        );
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { confirmationEmailLastError: errorMessage },
        });
      }
    }

    return result.updatedPayment;
  }

  async deletePayments(ids: string[]) {
    return this.prisma.$transaction(async (prisma) => {
      // Optional: Revert booking status?
      // For now, let's just delete the payments as requested.
      return prisma.payment.deleteMany({
        where: { id: { in: ids } },
      });
    });
  }

  async deleteAllPayments() {
    return this.prisma.payment.deleteMany({});
  }
}
