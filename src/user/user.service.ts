import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create.dto';
import { QueryUserDto } from './dto/query.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { UpdateUserDto } from './dto/update.dto';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  // 创建用户
  async create(createUserDto: CreateUserDto): Promise<any> {
    const { password = '123456', email } = createUserDto;

    // 对密码进行加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 生成随机头像和用户名
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/miniavs/svg?seed=${randomSeed}`;
    const username = faker.internet.username();
    const user = await this.userRepository.save({ username, password: hashedPassword, email, avatar: avatarUrl });

    if (!user) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '用户创建失败');
    }
    return user;
  }

  // 查询用户
  async findOne(queryUserDto: QueryUserDto): Promise<User> {
    const { id, username, email } = queryUserDto;
    const user = await this.userRepository.findOne({ where: { id, username, email } });
    if (!user) {
      return null;
    }
    return user;
  }

  // 更新用户信息
  async update(updateUserDto: UpdateUserDto, id: number) {
    const { username, password, email, avatar } = updateUserDto;
    const user = await this.userRepository.update(id, { username, password, email, avatar });
    if (!user) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新失败');
    }
    return user;
  }
}
