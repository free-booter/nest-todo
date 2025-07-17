import { CreateUserDto } from '../dto/create.dto';

export interface User extends CreateUserDto {
  id: number;
  username: string;
  password?: string;
  email: string;
  createdAt: Date;
  token?: string;
}

export interface UserRequest extends Request {
  user: {
    id: number;
  };
}
