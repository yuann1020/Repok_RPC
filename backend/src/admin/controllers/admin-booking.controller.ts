import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Delete,
  Body,
  Post,
} from '@nestjs/common';
import { AdminBookingService } from '../services/admin-booking.service';
import { FilterBookingsAdminDto } from '../dto/filter-bookings.admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/bookings')
export class AdminBookingController {
  constructor(private readonly adminBookingService: AdminBookingService) {}

  @Get()
  async getAllBookings(@Query() filterDto: FilterBookingsAdminDto) {
    return this.adminBookingService.getAllBookings(filterDto);
  }

  @Get(':id')
  async getBookingById(@Param('id') id: string) {
    return this.adminBookingService.getBookingById(id);
  }

  @Post('bulk-delete')
  async bulkDeleteBookings(@Body('ids') ids: string[]) {
    return this.adminBookingService.deleteBookings(ids);
  }

  @Delete('all')
  async deleteAllBookings() {
    return this.adminBookingService.deleteAllBookings();
  }
}
