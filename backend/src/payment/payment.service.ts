import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Targeted booking natively not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException(
        'Secure access strictly denied for this resource',
      );
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Booking is already securely locked and paid',
      );
    }

    if (booking.payment) {
      // If a payment record inherently exists but crashed/failed, seamlessly recycle it as UNPAID intent
      return this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.UNPAID },
      });
    }

    // Standard baseline creation hook allocating the UNPAID lock securely
    return this.prisma.payment.create({
      data: {
        bookingId,
        amount: booking.totalAmount,
        currency: 'MYR',
        paymentProvider: 'MANUAL_MOCK',
        status: PaymentStatus.UNPAID,
      },
    });
  }

  async getPaymentByBookingId(userId: string, bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });

    if (!payment || payment.booking.userId !== userId) {
      throw new NotFoundException(
        'Secure payment tracking object not discovered structurally or access bounded securely.',
      );
    }

    return payment;
  }

  async submitProof(userId: string, paymentId: string, proofImageUrl: string) {
    if (!proofImageUrl) {
      throw new BadRequestException('Proof image is required');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment || payment.booking.userId !== userId) {
      throw new NotFoundException('Payment explicitly not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Transaction was already securely concluded via parallel pipelines',
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PENDING_REVIEW,
          proofImageUrl,
        },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: PaymentStatus.PENDING_REVIEW,
        },
      });

      return updatedPayment;
    });
  }

  async markAsFailed(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment || payment.booking.userId !== userId) {
      throw new NotFoundException('Payment explicitly not found');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: PaymentStatus.FAILED },
        // Preserving BookingStatus logically intact to explicitly allow safe generic retry loops
      });

      return updatedPayment;
    });
  }
}
