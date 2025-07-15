import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateTagDto } from './dto/create-tag.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';

@Injectable()
export class TagService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = configService.getOrThrow<string>('SUPABASE_URL');
    const key = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(url, key);
  }

  // 创建标签
  async create(CreateTagDto: CreateTagDto) {
    const { name } = CreateTagDto;
    if (!name) {
      throw new CustomException(ErrorCode.PARAMS_ERROR, '标签名称不能为空');
    }
    const { data, error } = (await this.supabase.from('tag').insert({ name }).select().single()) as {
      data: { id: number } | null;
      error: Error | null;
    };
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    }
    return data;
  }
}
