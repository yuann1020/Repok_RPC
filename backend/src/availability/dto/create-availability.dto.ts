import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsNotEmpty()
  @IsUUID()
  courtId: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsDateString()
  endDate: string; // YYYY-MM-DD

  @IsOptional()
  @IsNumber()
  basePrice?: number;
}
