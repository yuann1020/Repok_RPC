import { IsEnum, IsOptional } from 'class-validator';
import { CourtCategory, CourtStatus } from '@prisma/client';

export class GetCourtsFilterDto {
  @IsOptional()
  @IsEnum(CourtCategory)
  category?: CourtCategory;

  @IsOptional()
  @IsEnum(CourtStatus)
  status?: CourtStatus;
}
