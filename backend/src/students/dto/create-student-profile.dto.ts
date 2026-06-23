import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStudentProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  facultyId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  joinCode!: string;
}
