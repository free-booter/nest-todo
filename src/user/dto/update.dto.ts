import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  username?: string;
  @IsOptional()
  @IsString({ message: '邮箱必须是字符串' })
  email?: string;
  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  avatar?: string;
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  password?: string;
}
