import { CreateAnnouncementDto } from './create-announcement.dto';

export class UpdateAnnouncementDto {
  title?: string;
  message?: string;
  type?: any; // To avoid issues with enums for now
  isActive?: boolean;
}
