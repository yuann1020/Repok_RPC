import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';

const ANALYTICS_CACHE_PREFIX = 'admin-analytics:summary:';
const ANALYTICS_SUMMARY_TTL_MS = 30_000;

type DailyBookingRow = {
  day: Date | string;
  bookings: bigint | number;
  revenue: Prisma.Decimal | number | string | null;
};

type HourlyBookingRow = {
  hour: number;
  bookings: bigint | number;
};

type CountRow = {
  count: bigint | number;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async getSummary(filters?: {
    month?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const cacheKey = `${ANALYTICS_CACHE_PREFIX}${filters?.month || ''}:${filters?.startDate || ''}:${filters?.endDate || ''}`;
    return this.cache.getOrSet(cacheKey, ANALYTICS_SUMMARY_TTL_MS, () =>
      this.computeSummary(filters),
    );
  }

  private async computeSummary(filters?: {
    month?: string;
    startDate?: string;
    endDate?: string;
  }) {
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
      label = filterStartDate.toLocaleDateString('default', {
        month: 'long',
        year: 'numeric',
      });
    } else {
      filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEndDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      label = filterStartDate.toLocaleDateString('default', {
        month: 'long',
        year: 'numeric',
      });
    }

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const dateFilter = {
      gte: filterStartDate,
      lte: filterEndDate,
    };

    // 1. Booking Metrics
    const [totalBookings, todayBookings, periodBookingStatusCounts] =
      await Promise.all([
        this.prisma.booking.count(),
        this.prisma.booking.count({
          where: { bookedAt: { gte: startOfToday } },
        }),
        this.prisma.booking.groupBy({
          by: ['status'],
          where: { bookedAt: dateFilter },
          _count: { _all: true },
        }),
      ]);

    const bookingStatusCountMap = new Map(
      periodBookingStatusCounts.map((item) => [item.status, item._count._all]),
    );
    const periodBookings = periodBookingStatusCounts.reduce(
      (total, item) => total + item._count._all,
      0,
    );
    const pendingBookings =
      bookingStatusCountMap.get(BookingStatus.PENDING) || 0;
    const confirmedBookings =
      bookingStatusCountMap.get(BookingStatus.CONFIRMED) || 0;
    const expiredBookings =
      bookingStatusCountMap.get(BookingStatus.EXPIRED) || 0;
    const cancelledBookings =
      bookingStatusCountMap.get(BookingStatus.CANCELLED) || 0;

    // 2. Revenue Metrics (Only PAID payments)
    const [
      totalRevenueData,
      periodRevenueData,
      todayRevenueData,
      walletPaymentRevenueData,
      manualQrRevenueData,
      stripeTopUpRevenueData,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, paidAt: dateFilter },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, paidAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paymentProvider: 'WALLET',
          paidAt: dateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paymentProvider: 'MANUAL_QR',
          paidAt: dateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.topUpOrder.aggregate({
        where: { status: 'PAID', paidAt: dateFilter },
        _sum: { amountRm: true },
      }), // Wallet topups
    ]);

    const totalRevenue = Number(totalRevenueData._sum.amount || 0);
    const periodRevenue = Number(periodRevenueData._sum.amount || 0);
    const todayRevenue = Number(todayRevenueData._sum.amount || 0);
    const walletPaymentRevenue = Number(
      walletPaymentRevenueData._sum.amount || 0,
    );
    // Manual QR revenue is either specified directly or everything else that isn't WALLET
    const manualQrRevenue =
      Number(manualQrRevenueData._sum.amount || 0) > 0
        ? Number(manualQrRevenueData._sum.amount || 0)
        : Number(periodRevenue - walletPaymentRevenue);
    const stripeTopUpRevenue = Number(
      stripeTopUpRevenueData._sum?.amountRm || 0,
    );

    // 3. Payment operation metrics
    const [pendingManualReviews, periodPaymentStatusCounts] = await Promise.all(
      [
        this.prisma.payment.count({
          where: { status: PaymentStatus.PENDING_REVIEW },
        }), // global pending review shouldn't be date filtered so admin always sees them
        this.prisma.payment.groupBy({
          by: ['status'],
          where: { createdAt: dateFilter },
          _count: { _all: true },
        }),
      ],
    );

    const paymentStatusCountMap = new Map(
      periodPaymentStatusCounts.map((item) => [item.status, item._count._all]),
    );
    const paidPayments = paymentStatusCountMap.get(PaymentStatus.PAID) || 0;
    const failedPayments = paymentStatusCountMap.get(PaymentStatus.FAILED) || 0;
    const unpaidPayments = paymentStatusCountMap.get(PaymentStatus.UNPAID) || 0;

    // 4. Court metrics
    const courtStats = await this.prisma.bookingItem.groupBy({
      by: ['courtId'],
      _count: { bookingId: true },
      where: {
        booking: { bookedAt: dateFilter },
      },
    });

    const courts = await this.prisma.court.findMany({
      select: { id: true, name: true },
    });
    const courtMap = new Map(courts.map((c) => [c.id, c.name]));

    let mostPopularCourt: {
      courtId: string | null;
      courtName: string;
      bookingCount: number;
    } = { courtId: null, courtName: 'N/A', bookingCount: 0 };
    const courtUtilization = courtStats
      .map((stat) => {
        const count = stat._count.bookingId;
        if (count > mostPopularCourt.bookingCount) {
          mostPopularCourt = {
            courtId: stat.courtId,
            courtName: courtMap.get(stat.courtId) || 'Unknown',
            bookingCount: count,
          };
        }
        return {
          courtId: stat.courtId,
          courtName: courtMap.get(stat.courtId) || 'Unknown',
          bookingCount: count,
          confirmedBookingCount: 0,
          revenue: 0,
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount);

    // 5. Time metrics & charts
    const [dailyBookingRows, hourlyBookingRows] = await Promise.all([
      this.prisma.$queryRaw<DailyBookingRow[]>(Prisma.sql`
        SELECT
          DATE(booked_at) AS day,
          COUNT(*)::bigint AS bookings,
          COALESCE(
            SUM(CASE WHEN status::text = ${BookingStatus.CONFIRMED} THEN total_amount ELSE 0 END),
            0
          ) AS revenue
        FROM bookings
        WHERE booked_at >= ${filterStartDate}
          AND booked_at <= ${filterEndDate}
        GROUP BY DATE(booked_at)
        ORDER BY day ASC
      `),
      this.prisma.$queryRaw<HourlyBookingRow[]>(Prisma.sql`
        SELECT
          EXTRACT(HOUR FROM booked_at)::int AS hour,
          COUNT(*)::bigint AS bookings
        FROM bookings
        WHERE booked_at >= ${filterStartDate}
          AND booked_at <= ${filterEndDate}
        GROUP BY hour
        ORDER BY hour ASC
      `),
    ]);

    const bookingsByDayMap = new Map<
      string,
      { date: string; bookings: number; revenue: number }
    >();
    const peakHourMap = new Map<number, number>();

    // Seed map with all dates in the range
    const currentDay = new Date(filterStartDate);
    while (currentDay <= filterEndDate) {
      const d = currentDay.toISOString().split('T')[0];
      bookingsByDayMap.set(d, { date: d, bookings: 0, revenue: 0 });
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Seed all hours for peak hour charts
    for (let i = 0; i < 24; i++) {
      peakHourMap.set(i, 0);
    }

    dailyBookingRows.forEach((row) => {
      const d =
        row.day instanceof Date
          ? row.day.toISOString().split('T')[0]
          : String(row.day).split('T')[0];
      const dayData = bookingsByDayMap.get(d);
      if (!dayData) {
        return;
      }

      dayData.bookings = Number(row.bookings || 0);
      dayData.revenue = Number(row.revenue || 0);
    });

    hourlyBookingRows.forEach((row) => {
      const hour = Number(row.hour);
      if (Number.isInteger(hour) && hour >= 0 && hour < 24) {
        peakHourMap.set(hour, Number(row.bookings || 0));
      }
    });

    const bookingsByDay = Array.from(bookingsByDayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    let peakBookingHour = { hour: 'N/A' as string | null, bookingCount: 0 };
    peakHourMap.forEach((count, hour) => {
      if (count > peakBookingHour.bookingCount) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        peakBookingHour = {
          hour: `${displayHour} ${ampm}`,
          bookingCount: count,
        };
      }
    });

    const bookingsByHour = Array.from(peakHourMap.entries())
      .map(([hour, count]) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return {
          hour,
          label: `${displayHour} ${ampm}`,
          bookings: count,
        };
      })
      .sort((a, b) => a.hour - b.hour);

    // 6. Customer metrics
    const [totalCustomers, newCustomersThisMonth] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: dateFilter },
      }),
    ]);

    const repeatCustomerRows = await this.prisma.$queryRaw<
      CountRow[]
    >(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT user_id
        FROM bookings
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) repeat_customers
    `);
    const repeatCustomers = Number(repeatCustomerRows[0]?.count || 0);

    // 7. Wallet metrics
    const [
      totalWalletTopUpsData,
      totalWalletCreditsIssuedData,
      totalWalletCreditsSpentData,
      totalWalletTopUps,
    ] = await Promise.all([
      this.prisma.topUpOrder.aggregate({
        where: { status: 'PAID' },
        _sum: { amountRm: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: 'TOP_UP', status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: 'DEDUCTION', status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.topUpOrder.count({ where: { status: 'PAID' } }),
    ]);

    const walletMetrics = {
      totalWalletTopUps,
      walletTopUpRevenue: Number(totalWalletTopUpsData._sum.amountRm || 0),
      totalWalletCreditsIssued: Number(
        totalWalletCreditsIssuedData._sum.amount || 0,
      ),
      totalWalletCreditsSpent: Number(
        totalWalletCreditsSpentData._sum.amount || 0,
      ),
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
        averageRevenuePerBooking:
          confirmedBookings > 0
            ? Number((periodRevenue / confirmedBookings).toFixed(2))
            : 0,
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
