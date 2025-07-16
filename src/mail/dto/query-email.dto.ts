import { IsEmail } from 'class-validator';

export class QueryEmailDto {
  @IsEmail()
  email: string;
}
