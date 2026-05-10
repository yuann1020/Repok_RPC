import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingExpiryService } from './booking-expiry.service';

import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [BookingController],
  providers: [BookingService, BookingExpiryService],
  exports: [BookingService],
})
export class BookingModule {}
