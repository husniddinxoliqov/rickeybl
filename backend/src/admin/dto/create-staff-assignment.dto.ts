import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStaffAssignmentDto {
  @IsString()
  @IsNotEmpty()
  facultyId!: string;

  @IsString()
  @IsOptional()
  groupId?: string;
}
