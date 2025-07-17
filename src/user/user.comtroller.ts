import { Controller, Post, Body, Get, Param, Put, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequest } from './interfaces/user.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne({ id });
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async update(@Body() updateUserDto: UpdateUserDto, @Req() req: UserRequest) {
    const user = await this.userService.findOne({ id: req.user.id });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    // 合并user和updateUserDto
    const params = {
      ...user,
      ...updateUserDto,
    };
    return this.userService.update(params, user.id);
  }
}
