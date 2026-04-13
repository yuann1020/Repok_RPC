import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  availabilityIds: string[];
}
