import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import type { UpdateActivityRequest } from '@tripcollab/shared';
import { HH_MM, trimString } from './activity-dto.utils.js';

const defined = (_: unknown, value: unknown) => value !== undefined;

export class UpdateActivityDto implements UpdateActivityRequest {
  @IsInt() @Min(1) expectedVersion!: number;

  // Not nullable: null must be rejected, so use ValidateIf instead of IsOptional.
  @ValidateIf(defined) @IsUUID() itineraryDayId?: string;
  @ValidateIf(defined) @Transform(trimString) @IsString() @IsNotEmpty() @MaxLength(160)
  title?: string;
  @ValidateIf(defined) @Matches(HH_MM) startTime?: string;

  // Nullable: null means "clear this value".
  @IsOptional() @Matches(HH_MM) endTime?: string | null;
  @IsOptional() @IsString() @MaxLength(255) location?: string | null;
  @IsOptional() @IsString() description?: string | null;
}