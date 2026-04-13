import { IsOptional, IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class FilterPaymentsAdminDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
