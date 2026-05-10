import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WalletService } from '../wallet/wallet.service';

@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(private readonly walletService: WalletService) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.walletService.handleStripeWebhook(req.body as Buffer, signature);
  }
}
