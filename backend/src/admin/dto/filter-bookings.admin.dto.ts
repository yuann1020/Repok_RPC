import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class FilterBookingsAdminDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsDateString()
  date?: string; // YYYY-MM-DD for bookedAt tracking logic boundaries

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  courtId?: string;
}
