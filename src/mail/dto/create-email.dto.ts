import { IsEmail } from 'class-validator';

export class CreateEmailDto {
  @IsEmail()
  email: string;
  code: string;
  expirationTime: string | Date;
  used: boolean;
}
