import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateTagDto } from './dto/create-tag.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { UpdateTagDto } from './dto/update-tag.dto';
import { SupabaseService } from 'src/common/services/supabase.service';

@Injectable()
export class TagService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // 创建标签
  async create(CreateTagDto: CreateTagDto, userId: number) {
    const { name } = CreateTagDto;
    const { data, error } = (await this.supabase.from('tag').insert({ name, userId: userId }).select().single()) as {
      data: { id: number } | null;
      error: Error | null;
    };
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    }
    return {
      value: data.id,
      label: name,
    };
  }

  // 删除标签
  async delete(tagId: number) {
    const { error } = (await this.supabase.from('tag').delete().eq('id', tagId).select().single()) as {
      data: { id: number } | null;
      error: Error | null;
    };
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    }
    return;
  }

  // 更新标签
  async update(tagId: number, updateTagDto: UpdateTagDto) {
    const { name } = updateTagDto;
    const { error } = (await this.supabase.from('tag').update({ name }).eq('id', tagId).select().single()) as {
      data: { id: number } | null;
      error: Error | null;
    };
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    }
    return;
  }

  // 获取列表
  async getList(userId: number) {
    const { data, error } = (await this.supabase.from('tag').select('*').eq('userId', userId)) as {
      data: { id: number } | null;
      error: Error | null;
    };
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    }
    return data;
  }
}
