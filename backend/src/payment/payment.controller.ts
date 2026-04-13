import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':bookingId/initiate')
  async initiatePayment(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentService.initiatePayment(req.user.userId, bookingId);
  }

  @Get('booking/:bookingId')
  async getPayment(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.paymentService.getPaymentByBookingId(
      req.user.userId,
      bookingId,
    );
  }

  @Post(':id/proof')
  async uploadProof(
    @Request() req: any,
    @Param('id') id: string,
    @Body('proofImageUrl') proofImageUrl: string,
  ) {
    return this.paymentService.submitProof(req.user.userId, id, proofImageUrl);
  }

  @Post(':id/fail')
  async paymentFail(@Request() req: any, @Param('id') id: string) {
    return this.paymentService.markAsFailed(req.user.userId, id);
  }
}
