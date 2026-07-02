import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  body?: string;

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
