import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  body!: string;

  @IsOptional()
  @IsObject()
  titleI18n?: Record<string, string>;

  @IsOptional()
  @IsObject()
  bodyI18n?: Record<string, string>;

  @IsOptional()
  @IsString()
  facultyId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
