import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CredentialLoginDto {
  @IsEmail()
  @MaxLength(128)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
