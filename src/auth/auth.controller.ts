import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenResponse } from './auth.service';

interface LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    console.log(user);
    return this.authService.userLogin(user);
  }
}
