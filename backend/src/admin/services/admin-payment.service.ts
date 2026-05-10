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
      include: {
        booking: {
          select: {
            bookingReference: true,
            status: true,
            user: { select: { email: true, fullName: true } },
          },
        },
      },
    });
  }

  async getPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { booking: { include: { user: true } } },
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
      include: { booking: { include: { user: true } } },
    });
    if (!payment)
      throw new NotFoundException(
        'Targeted booking lacks a tracked financial mapping securely',
      );
    return payment;
  }

  async reviewPayment(id: string, status: PaymentStatus) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: true,
            items: { include: { court: true } },
          },
        },
      },
    });
    if (!payment)
      throw new NotFoundException('Payment record not securely located');

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
              : BookingStatus.PENDING,
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
        const lastItem = payment.booking.items[payment.booking.items.length - 1];

        await this.emailService.sendBookingConfirmationEmail({
          email: payment.booking.user.email,
          customerName: payment.booking.user.fullName || 'Customer',
          bookingReference: payment.booking.bookingReference,
          courtName: firstItem?.court?.name || 'Pickleball Court',
          bookingDate: firstItem?.startTime.toISOString().split('T')[0] || 'TBD',
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
        this.logger.error(`Failed to send confirmation email for booking ${payment.bookingId}`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
