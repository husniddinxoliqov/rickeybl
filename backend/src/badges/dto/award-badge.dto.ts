import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AwardBadgeDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  badgeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
