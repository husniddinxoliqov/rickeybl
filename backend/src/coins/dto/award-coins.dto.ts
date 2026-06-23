import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class AwardCoinsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsInt()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}
