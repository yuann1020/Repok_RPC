import { IsIn, IsOptional } from 'class-validator';

export const TOP_UP_PACKAGE_CODES = ['RM50', 'RM100', 'RM200', 'RM500'] as const;
export const MIN_CUSTOM_TOP_UP_RM = 10;
export const MAX_CUSTOM_TOP_UP_RM = 2000;

export type TopUpPackageCode = (typeof TOP_UP_PACKAGE_CODES)[number];

export class CreateStripeTopUpDto {
  @IsOptional()
  @IsIn(TOP_UP_PACKAGE_CODES)
  packageCode?: TopUpPackageCode;

  @IsOptional()
  customAmount?: number;
}
