import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingService } from './booking.service';

@Injectable()
export class BookingExpiryService {
  private readonly logger = new Logger(BookingExpiryService.name);

  constructor(private readonly bookingService: BookingService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireStaleBookings() {
    try {
      const result = await this.bookingService.expireUnpaidBookings();

      if (result.expiredCount > 0) {
        this.logger.log(`Expired ${result.expiredCount} unpaid booking(s).`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to expire unpaid bookings: ${message}`);
    }
  }
}
