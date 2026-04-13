import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterPaymentsAdminDto } from '../dto/filter-payments.admin.dto';
import { PaymentStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class AdminPaymentService {
  constructor(private readonly prisma: PrismaService) {}

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
    });
    if (!payment)
      throw new NotFoundException('Payment record not securely located');

    return this.prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status,
          paidAt: status === PaymentStatus.PAID ? new Date() : null,
        },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: status,
          status:
            status === PaymentStatus.PAID
              ? BookingStatus.CONFIRMED
              : BookingStatus.PENDING,
        },
      });

      return updatedPayment;
    });
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
