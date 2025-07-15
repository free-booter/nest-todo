import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = configService.getOrThrow<string>('SUPABASE_URL');
    const key = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(url, key);
  }

  // 创建用户
  async create(createUserDto: CreateUserDto): Promise<any> {
    const { username, password, email } = createUserDto;

    // 对密码进行加密
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const response = await this.supabase
      .from('user')
      .insert({ username, password: hashedPassword, email })
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
  async findOne(queryUserDto: QueryUserDto): Promise<any> {
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
      throw new CustomException(ErrorCode.NOT_FOUND, '用户不存在');
    }
    const user = data[0];
    return user;
  }
}
