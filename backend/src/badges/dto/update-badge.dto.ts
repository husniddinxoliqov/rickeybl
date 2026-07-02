import { IsBoolean, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateBadgeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  nameI18n?: Record<string, string>;

  @IsOptional()
  @IsObject()
  descriptionI18n?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  requiredCoins?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
