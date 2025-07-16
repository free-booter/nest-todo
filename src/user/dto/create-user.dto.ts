import { IsEmail, IsOptional, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  password?: string;
  @IsOptional()
  @IsString({ message: '验证码必须是字符串' })
  @MinLength(6, { message: '请输入6位验证码' })
  code?: string;
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  username?: string;
  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  avatar?: string;
  token?: string;
}
