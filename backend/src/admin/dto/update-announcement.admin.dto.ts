import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

const announcementTypes = ['INFO', 'MAINTENANCE', 'CLOSURE'] as const;
type AnnouncementTypeValue = (typeof announcementTypes)[number];

export class UpdateAnnouncementAdminDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsIn(announcementTypes)
  type?: AnnouncementTypeValue;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  imageUrls?: string[];

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;
}
