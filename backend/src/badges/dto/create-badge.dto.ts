import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

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
