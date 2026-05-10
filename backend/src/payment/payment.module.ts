import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { WalletModule } from '../wallet/wallet.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [WalletModule, BookingModule],
  controllers: [PaymentController, StripeWebhookController],
  providers: [PaymentService],
})
export class PaymentModule {}
