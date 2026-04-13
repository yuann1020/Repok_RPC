import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';
import { CourtCategory, CourtStatus, CourtType } from '@prisma/client';

export class CreateCourtAdminDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(CourtCategory)
  category: CourtCategory;

  @IsNumber()
  pricePerHour: number;

  @IsOptional()
  @IsEnum(CourtStatus)
  status?: CourtStatus;

  @IsOptional()
  @IsEnum(CourtType)
  courtType?: CourtType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];
}
