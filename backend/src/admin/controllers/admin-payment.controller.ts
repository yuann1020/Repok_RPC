import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AdminPaymentService } from '../services/admin-payment.service';
import { PaymentStatus } from '@prisma/client';
import { FilterPaymentsAdminDto } from '../dto/filter-payments.admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/payments')
export class AdminPaymentController {
  constructor(private readonly adminPaymentService: AdminPaymentService) {}

  @Get()
  async getAllPayments(@Query() filterDto: FilterPaymentsAdminDto) {
    return this.adminPaymentService.getAllPayments(filterDto);
  }

  @Get(':id')
  async getPaymentById(@Param('id') id: string) {
    return this.adminPaymentService.getPaymentById(id);
  }

  @Get('booking/:bookingId')
  async getPaymentByBookingId(@Param('bookingId') bookingId: string) {
    return this.adminPaymentService.getPaymentByBookingId(bookingId);
  }

  @Post(':id/review')
  async reviewPayment(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ) {
    return this.adminPaymentService.reviewPayment(id, status);
  }

  @Post('bulk-delete')
  async bulkDeletePayments(@Body('ids') ids: string[]) {
    return this.adminPaymentService.deletePayments(ids);
  }

  @Post('delete-all') // Using Post for delete all to avoid accidental browser GET if configured wrongly
  async deleteAllPayments() {
    return this.adminPaymentService.deleteAllPayments();
  }
}
