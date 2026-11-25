import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import type { CreateActivityRequest } from '@tripcollab/shared';
import { HH_MM, trimString } from './activity-dto.utils.js';

export class CreateActivityDto implements CreateActivityRequest {
  @IsUUID() itineraryDayId!: string;

  @Transform(trimString) @IsString() @IsNotEmpty() @MaxLength(160)
  title!: string;

  @Matches(HH_MM) startTime!: string;

  @IsOptional()  @Matches(HH_MM) endTime?: string | null;
  @IsOptional() @IsString() @MaxLength(255) location?: string | null;
  @IsOptional() @IsString() description?: string | null;
}