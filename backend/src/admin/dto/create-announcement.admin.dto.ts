import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

const announcementTypes = ['INFO', 'MAINTENANCE', 'CLOSURE'] as const;
type AnnouncementTypeValue = (typeof announcementTypes)[number];

export class CreateAnnouncementAdminDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsIn(announcementTypes)
  type: AnnouncementTypeValue;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10)
  imageUrls?: string[];

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
