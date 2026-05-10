import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(filters?: { month?: string; startDate?: string; endDate?: string }) {
    const now = new Date();
    
    let filterStartDate: Date;
    let filterEndDate: Date;
    let label = '';

    if (filters?.startDate && filters?.endDate) {
      filterStartDate = new Date(`${filters.startDate}T00:00:00.000Z`);
      filterEndDate = new Date(`${filters.endDate}T23:59:59.999Z`);
      label = `${filters.startDate} to ${filters.endDate}`;
    } else if (filters?.month) {
      // month is like "2026-05"
      const [yearStr, monthStr] = filters.month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIdx = parseInt(monthStr, 10) - 1;
      filterStartDate = new Date(year, monthIdx, 1);
      filterEndDate = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
      label = filterStartDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    } else {
      filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = filterStartDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateFilter = {
      gte: filterStartDate,
      lte: filterEndDate,
    };

    // 1. Booking Metrics
    const [
      totalBookings,
      todayBookings,
      periodBookings,
      pendingBookings,
      confirmedBookings,
      expiredBookings,
      cancelledBookings,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { bookedAt: { gte: startOfToday } } }),
      this.prisma.booking.count({ where: { bookedAt: dateFilter } }),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING, bookedAt: dateFilter } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CONFIRMED, bookedAt: dateFilter } }),
      this.prisma.booking.count({ where: { status: BookingStatus.EXPIRED, bookedAt: dateFilter } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED, bookedAt: dateFilter } }),
    ]);

    // 2. Revenue Metrics (Only PAID payments)
    const [
      totalRevenueData,
      periodRevenueData,
      todayRevenueData,
      walletPaymentRevenueData,
      manualQrRevenueData,
      stripeTopUpRevenueData,
    ] = await Promise.all([
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.PAID }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.PAID, paidAt: dateFilter }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.PAID, paidAt: { gte: startOfToday } }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.PAID, paymentProvider: 'WALLET', paidAt: dateFilter }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.PAID, paymentProvider: 'MANUAL_QR', paidAt: dateFilter }, _sum: { amount: true } }),
      this.prisma.topUpOrder.aggregate({ where: { status: 'PAID', paidAt: dateFilter }, _sum: { amountRm: true } }), // Wallet topups
    ]);

    const totalRevenue = Number(totalRevenueData._sum.amount || 0);
    const periodRevenue = Number(periodRevenueData._sum.amount || 0);
    const todayRevenue = Number(todayRevenueData._sum.amount || 0);
    const walletPaymentRevenue = Number(walletPaymentRevenueData._sum.amount || 0);
    // Manual QR revenue is either specified directly or everything else that isn't WALLET
    const manualQrRevenue = Number(manualQrRevenueData._sum.amount || 0) > 0 ? Number(manualQrRevenueData._sum.amount || 0) : Number(periodRevenue - walletPaymentRevenue); 
    const stripeTopUpRevenue = Number(stripeTopUpRevenueData._sum?.amountRm || 0);

    // 3. Payment operation metrics
    const [
      pendingManualReviews,
      paidPayments,
      failedPayments,
      unpaidPayments,
    ] = await Promise.all([
      this.prisma.payment.count({ where: { status: 'PENDING_REVIEW' as any } }), // global pending review shouldn't be date filtered so admin always sees them
      this.prisma.payment.count({ where: { status: PaymentStatus.PAID, createdAt: dateFilter } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED, createdAt: dateFilter } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.UNPAID, createdAt: dateFilter } }),
    ]);

    // 4. Court metrics
    const courtStats = await this.prisma.bookingItem.groupBy({
      by: ['courtId'],
      _count: { bookingId: true },
      where: {
        booking: { bookedAt: dateFilter }
      }
    });

    const courts = await this.prisma.court.findMany({ select: { id: true, name: true } });
    const courtMap = new Map(courts.map((c) => [c.id, c.name]));

    let mostPopularCourt = { courtId: null, courtName: 'N/A', bookingCount: 0 };
    const courtUtilization = courtStats.map((stat) => {
      const count = stat._count.bookingId;
      if (count > mostPopularCourt.bookingCount) {
        mostPopularCourt = { courtId: stat.courtId as any, courtName: courtMap.get(stat.courtId) || 'Unknown', bookingCount: count };
      }
      return {
        courtId: stat.courtId,
        courtName: courtMap.get(stat.courtId) || 'Unknown',
        bookingCount: count,
        confirmedBookingCount: 0,
        revenue: 0,
      };
    }).sort((a, b) => b.bookingCount - a.bookingCount);

    // 5. Time metrics & charts
    const periodBookingsRecords = await this.prisma.booking.findMany({
      where: { bookedAt: dateFilter },
      select: { bookedAt: true, status: true, totalAmount: true }
    });

    const bookingsByDayMap = new Map<string, { date: string; bookings: number; revenue: number }>();
    const peakHourMap = new Map<number, number>();

    // Seed map with all dates in the range
    let currentDay = new Date(filterStartDate);
    while (currentDay <= filterEndDate) {
      const d = currentDay.toISOString().split('T')[0];
      bookingsByDayMap.set(d, { date: d, bookings: 0, revenue: 0 });
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Seed all hours for peak hour charts
    for (let i = 0; i < 24; i++) {
      peakHourMap.set(i, 0);
    }

    periodBookingsRecords.forEach(b => {
      // Day aggregation
      const d = b.bookedAt.toISOString().split('T')[0];
      if (bookingsByDayMap.has(d)) {
        const dayData = bookingsByDayMap.get(d)!;
        dayData.bookings += 1;
        if (b.status === BookingStatus.CONFIRMED) {
          dayData.revenue += Number(b.totalAmount);
        }
      }
      // Hour aggregation (UTC or local conceptually, mapping using UTC for simplicity)
      const h = b.bookedAt.getHours();
      peakHourMap.set(h, (peakHourMap.get(h) || 0) + 1);
    });

    const bookingsByDay = Array.from(bookingsByDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    let peakBookingHour = { hour: 'N/A' as string | null, bookingCount: 0 };
    peakHourMap.forEach((count, hour) => {
      if (count > peakBookingHour.bookingCount) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        peakBookingHour = { hour: `${displayHour} ${ampm}`, bookingCount: count };
      }
    });

    const bookingsByHour = Array.from(peakHourMap.entries()).map(([hour, count]) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return {
        hour,
        label: `${displayHour} ${ampm}`,
        bookings: count
      };
    }).sort((a, b) => a.hour - b.hour);

    // 6. Customer metrics
    const [totalCustomers, newCustomersThisMonth] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: dateFilter } }),
    ]);

    const repeatCustomerGroups = await this.prisma.booking.groupBy({
      by: ['userId'],
      having: {
        userId: { _count: { gt: 1 } }
      }
    });
    const repeatCustomers = repeatCustomerGroups.length;

    // 7. Wallet metrics
    const [
      totalWalletTopUpsData,
      totalWalletCreditsIssuedData,
      totalWalletCreditsSpentData,
      totalWalletTopUps
    ] = await Promise.all([
      this.prisma.topUpOrder.aggregate({ where: { status: 'PAID' }, _sum: { amountRm: true } }),
      this.prisma.walletTransaction.aggregate({ where: { type: 'TOP_UP', status: 'SUCCESS' }, _sum: { amount: true } }),
      this.prisma.walletTransaction.aggregate({ where: { type: 'DEDUCTION', status: 'SUCCESS' }, _sum: { amount: true } }),
      this.prisma.topUpOrder.count({ where: { status: 'PAID' } })
    ]);

    const walletMetrics = {
      totalWalletTopUps,
      walletTopUpRevenue: Number(totalWalletTopUpsData._sum.amountRm || 0),
      totalWalletCreditsIssued: Number(totalWalletCreditsIssuedData._sum.amount || 0),
      totalWalletCreditsSpent: Number(totalWalletCreditsSpentData._sum.amount || 0),
    };

    // Construct Summary
    return {
      selectedRange: {
        startDate: filterStartDate,
        endDate: filterEndDate,
        label,
      },
      bookingMetrics: {
        totalBookings,
        todayBookings,
        periodBookings,
        pendingBookings,
        confirmedBookings,
        expiredBookings,
        cancelledBookings,
      },
      revenueMetrics: {
        totalRevenue,
        periodRevenue,
        thisMonthRevenue: periodRevenue, // keep backwards compat
        todayRevenue,
        walletPaymentRevenue,
        manualQrRevenue,
        stripeTopUpRevenue,
        averageRevenuePerBooking: confirmedBookings > 0 ? Number((periodRevenue / confirmedBookings).toFixed(2)) : 0,
      },
      paymentMetrics: {
        pendingManualReviews,
        paidPayments,
        failedPayments,
        unpaidPayments,
      },
      courtMetrics: {
        mostPopularCourt,
        courtUtilization,
      },
      timeMetrics: {
        bookingsByDay,
        peakBookingHour,
        bookingsByHour,
      },
      customerMetrics: {
        totalCustomers,
        repeatCustomers,
        newCustomersThisMonth,
      },
      walletMetrics,
    };
  }
}
