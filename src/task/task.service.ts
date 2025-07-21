import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateTaskDto } from './dto/create-task.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = configService.getOrThrow<string>('SUPABASE_URL');
    const key = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(url, key);
  }

  // 创建任务
  async create(createTaskDto: CreateTaskDto & { userId: number }): Promise<any> {
    const { tagIds, ...taskData } = createTaskDto;

    // 1. 创建任务
    const { data, error } = (await this.supabase.from('task').insert(taskData).select().maybeSingle()) as {
      data: { id: number } | null;
      error: Error | null;
    };
    if (error || !data) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '创建任务失败');
    }
    // 2. 创建任务标签关联
    if (tagIds && tagIds.length > 0) {
      const { error: tagError } = await this.supabase
        .from('task_tag')
        .insert(tagIds.map((tagId) => ({ taskId: data.id, tagId: tagId })));
      if (tagError) {
        throw new CustomException(ErrorCode.INTERNAL_ERROR, '创建任务标签关联失败');
      }
    }
    return data;
  }

  // 获取任务列表
  async getTaskList(userId: number, queryTaskDto: QueryTaskDto): Promise<any> {
    const { current = 1, size = 10, keyword, status, priority, tagId } = queryTaskDto;
    // 1. 构建基础查询
    let query = this.supabase
      .from('task')
      .select(
        `
        *,
        tagIds:task_tag (
          tagId
        )
      `,
        { count: 'exact' },
      )
      .eq('userId', userId);

    // 2. 添加筛选条件
    if (status !== undefined) {
      query = query.eq('status', status);
    }

    if (priority !== undefined) {
      query = query.eq('priority', priority);
    }

    // 3. 关键词搜索（标题和描述）
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    // 4. 标签筛选
    if (tagId) {
      query = query.eq('task_tag.tagId', tagId);
    }

    // 5. 分页
    const from = (current - 1) * size;
    const to = from + size - 1;

    query = query.order('createdAt', { ascending: false }).range(from, to);

    // 6. 执行查询
    const { data, error, count } = await query;
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '获取任务列表失败');
    }

    // 7. 返回结果
    return {
      list: data || [],
      current,
      size,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / size),
    };
  }

  // 获取任务详情
  async getTaskDetail(userId: number, taskId: number) {
    const { data, error } = await this.supabase
      .from('task')
      .select(
        `
        *,
        tagIds:task_tag (
          tagId
        )
      `,
      )
      .eq('id', taskId)
      .eq('userId', userId)
      .single();

    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '获取任务详情失败');
    }

    if (!data) {
      throw new CustomException(ErrorCode.NOT_FOUND, '任务不存在');
    }

    return data;
  }

  // 更新任务
  async updateTask(userId: number, taskId: number, updateTaskDto: UpdateTaskDto) {
    const { data, error } = await this.supabase
      .from('task')
      .update(updateTaskDto)
      .eq('id', taskId)
      .eq('userId', userId)
      .single();
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新任务失败');
    }
    return data;
  }
}
