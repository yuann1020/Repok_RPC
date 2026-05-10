import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStripeTopUpDto } from './dto/create-stripe-top-up.dto';
import { WalletService } from './wallet.service';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Request() req: any) {
    return this.walletService.getWalletSummary(req.user.userId);
  }

  @Get('transactions')
  async getTransactions(@Request() req: any) {
    return this.walletService.getTransactions(req.user.userId);
  }

  @Post('top-ups/stripe-checkout')
  async createStripeCheckout(
    @Request() req: any,
    @Body() dto: CreateStripeTopUpDto,
  ) {
    return this.walletService.createStripeCheckoutSession(req.user.userId, dto);
  }

  @Get('top-ups/:id')
  async getTopUpOrder(@Request() req: any, @Param('id') id: string) {
    return this.walletService.getTopUpOrder(req.user.userId, id);
  }
}
