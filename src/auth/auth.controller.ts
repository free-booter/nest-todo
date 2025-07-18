import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create.dto';
import { User } from 'src/user/interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: CreateUserDto): Promise<{ userInfo: User } & { token: string }> {
    const user = await this.authService.validateUser(loginDto);
    return this.authService.userLogin(user);
  }
}
