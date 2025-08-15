import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateUserDto } from './dto/create.dto';
import { QueryUserDto } from './dto/query.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { UpdateUserDto } from './dto/update.dto';
import { SupabaseService } from 'src/common/services/supabase.service';

@Injectable()
export class UserService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

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
    const response = await this.supabase
      .from('user')
      .insert({ username, password: hashedPassword, email, avatar: avatarUrl })
      .select()
      .single();

    const { data, error: userError } = response as { data: { id: number } | null; error: Error | null };
    if (userError) throw userError;
    if (!data) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '用户创建失败');
    }
    const user = data;
    return user;
  }

  // 查询用户
  async findOne(queryUserDto: QueryUserDto): Promise<User> {
    const { id, username, email } = queryUserDto;
    const response = this.supabase.from('user').select('*');
    if (id) {
      response.eq('id', id);
    }
    if (username) {
      response.eq('username', username);
    }
    if (email) {
      response.eq('email', email);
    }
    const { data, error: userError } = (await response) as { data: User[] | null; error: Error | null };
    if (userError) {
      throw userError;
    }
    if (!data || data.length === 0) {
      return null;
    }
    const user = data[0];
    return user;
  }

  // 更新用户信息
  async update(updateUserDto: UpdateUserDto, id: number) {
    const { username, password, email, avatar } = updateUserDto;
    const response = this.supabase.from('user').update({ username, password, email, avatar }).eq('id', id).select();
    const { data, error: userError } = (await response) as { data: User[] | null; error: Error | null };
    if (userError) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新失败');
    }
    if (!data || data.length === 0) {
      throw new CustomException(ErrorCode.NOT_FOUND, '用户不存在');
    }
    const user = data[0];
    return user;
  }
}
