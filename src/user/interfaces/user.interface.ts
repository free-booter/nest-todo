import { CreateUserDto } from '../dto/create-user.dto';

export interface User extends CreateUserDto {
  id: number;
  username: string;
  password?: string;
  email: string;
  createdAt: Date;
  token?: string;
}
