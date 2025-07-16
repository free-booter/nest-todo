import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 验证用户 支持邮箱和密码/验证码
   * @param email 邮箱
   * @param password 密码
   * @param code 验证码
   * @returns 用户
   */
  async validateUser({ email, password, code }: CreateUserDto): Promise<User> {
    /**
     * 查找用户是否存在
     * 如果是邮箱和验证码登录，则直接注册
     * 否则，提示用户注册
     */
    let user = await this.userService.findOne({ email });
    if (!user && !code) {
      throw new UnauthorizedException('用户不存在');
    }
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('密码错误');
      }
    } else if (code) {
      const isCodeValid = await this.mailService.verifyVerificationCode(email, code);
      if (!isCodeValid) {
        throw new UnauthorizedException('验证码错误');
      }
    } else {
      throw new UnauthorizedException('请输入邮箱和密码或验证码');
    }

    if (!user && code) {
      // 创建用户
      const newUser = (await this.userService.create({ email, code })) as User;
      user = newUser;
    }
    return user;
  }

  userLogin(user: User): User {
    const payload = { username: user.username, sub: user.id };
    // 删除user中的password
    delete user.password;
    return {
      ...user,
      token: this.jwtService.sign(payload),
    };
  }
}
