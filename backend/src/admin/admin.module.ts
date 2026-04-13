import { Module } from '@nestjs/common';
import { AdminAnnouncementController } from './controllers/admin-announcement.controller';
import { AdminCourtController } from './controllers/admin-court.controller';
import { AdminBookingController } from './controllers/admin-booking.controller';
import { AdminPaymentController } from './controllers/admin-payment.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminAnnouncementService } from './services/admin-announcement.service';
import { AdminCourtService } from './services/admin-court.service';
import { AdminBookingService } from './services/admin-booking.service';
import { AdminPaymentService } from './services/admin-payment.service';
import { AdminUserService } from './services/admin-user.service';

@Module({
  controllers: [
    AdminAnnouncementController,
    AdminCourtController,
    AdminBookingController,
    AdminPaymentController,
    AdminUserController,
  ],
  providers: [
    AdminAnnouncementService,
    AdminCourtService,
    AdminBookingService,
    AdminPaymentService,
    AdminUserService,
  ],
})
export class AdminModule {}
