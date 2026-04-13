import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  async createBooking(
    @Request() req: any,
    @Body() createDto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(req.user.userId, createDto);
  }

  @Get()
  async getMyBookings(@Request() req: any) {
    return this.bookingService.getMyBookings(req.user.userId);
  }

  @Get(':id')
  async getBookingById(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.getMyBookingById(req.user.userId, id);
  }

  @Patch(':id/cancel')
  async cancelBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.cancelBooking(req.user.userId, id);
  }
}
