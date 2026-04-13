import {
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAvailabilityDto {
  @IsOptional()
  @IsUUID()
  courtId?: string;

  @IsOptional()
  @IsDateString()
  date?: string; // YYYY-MM-DD format

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeUnavailable?: boolean;
}
