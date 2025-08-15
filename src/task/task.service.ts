import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateTaskDto } from './dto/create-task.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SupabaseService } from 'src/common/services/supabase.service';

@Injectable()
export class TasksService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(TasksService.name);

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
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

    return this.getTaskDetail(createTaskDto.userId, data.id);
  }

  // 获取任务列表
  async getTaskList(userId: number, queryTaskDto: QueryTaskDto): Promise<any> {
    const startTime = Date.now();
    try {
      const { current = 1, size = 10, keyword, status, priority, tagId } = queryTaskDto;
      // 1. 构建基础查询
      let query = this.supabase
        .from('task')
        .select(
          `
          *,
          tags:task_tag (
            tag:tagId (
              value:id,
              label:name
            )
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
      const {
        data: taskData,
        error,
        count,
      } = (await query) as {
        data: (CreateTaskDto & { id: number; tags: { tag: { id: number; name: string } }[] })[];
        error: Error | null;
        count: number;
      };
      if (error) {
        throw new CustomException(ErrorCode.INTERNAL_ERROR, '获取任务列表失败');
      }

      const result = {
        list:
          taskData?.map((item) => ({
            ...item,
            tags: item.tags.map((tag: { tag: { id: number; name: string } }) => tag.tag),
          })) || [],
        current,
        size,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / size),
      };

      const endTime = Date.now();
      this.logger.log(`获取任务列表耗时: ${endTime - startTime}ms, 数据量: ${taskData?.length || 0}`);
      return result;
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(`获取任务列表失败，耗时: ${endTime - startTime}ms`, error);
      throw error;
    }
  }

  // 获取任务详情
  async getTaskDetail(
    userId: number,
    taskId: number,
  ): Promise<CreateTaskDto & { id: number; tags: { value: number; label: string }[] }> {
    const startTime = Date.now();
    try {
      // 获取任务信息和关联的标签
      const { data: taskData, error: taskError } = (await this.supabase
        .from('task')
        .select(
          `
          *,
          tags:task_tag (
            tag:tagId (
              value:id,
              label:name
            )
          )
        `,
        )
        .eq('id', taskId)
        .eq('userId', userId)
        .single()) as {
        data: (CreateTaskDto & { id: number; tags: { tag: { value: number; label: string } }[] }) | null;
        error: Error | null;
      };

      if (taskError) {
        throw new CustomException(ErrorCode.INTERNAL_ERROR, '获取任务详情失败');
      }

      // 提取标签信息
      const tags = taskData.tags
        ? taskData.tags.map((item: { tag: { value: number; label: string } }) => item.tag)
        : [];

      const endTime = Date.now();
      this.logger.log(`获取任务详情耗时: ${endTime - startTime}ms`);
      return {
        ...taskData,
        tags,
        specificTime: taskData.specificTime ? taskData.specificTime.slice(0, 5) : null,
        remindTime: taskData.remindTime ? taskData.remindTime.slice(0, 5) : null,
      };
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(`获取任务详情失败，耗时: ${endTime - startTime}ms`, error);
      throw error;
    }
  }

  // 更新任务
  async updateTask(userId: number, updateTaskDto: UpdateTaskDto) {
    const startTime = Date.now();
    const { tagIds, ...taskData } = updateTaskDto;
    try {
      if (tagIds && tagIds.length > 0) {
        // 先清空再插入
        const { error: tagError } = await this.supabase.from('task_tag').delete().eq('taskId', updateTaskDto.id);
        if (tagError) {
          throw new CustomException(ErrorCode.INTERNAL_ERROR, '删除任务标签关联失败');
        }
        const { error: tagError2 } = await this.supabase
          .from('task_tag')
          .insert(tagIds.map((tagId) => ({ taskId: updateTaskDto.id, tagId: tagId })));
        if (tagError2) {
          throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新任务标签关联失败');
        }
      }
      const { data, error } = (await this.supabase
        .from('task')
        .update(taskData)
        .eq('id', updateTaskDto.id)
        .eq('userId', userId)
        .select(
          `
        *,
        tags:task_tag (
          tag:tagId (
            value:id,
            label:name
          )
        )
      `,
        )
        .single()) as {
        data: (CreateTaskDto & { id: number; tags: { tag: { value: number; label: string } }[] }) | null;
        error: Error | null;
      };
      if (error) {
        throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新任务失败');
      }
      const endTime = Date.now();
      this.logger.log(`更新任务耗时: ${endTime - startTime}ms`);
      return {
        ...data,
        tags: data.tags?.map((tag) => tag.tag) || [],
        specificTime: data.specificTime ? data.specificTime.slice(0, 5) : null,
        remindTime: data.remindTime ? data.remindTime.slice(0, 5) : null,
      };
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(`更新任务失败，耗时: ${endTime - startTime}ms`, error);
      throw error;
    }
  }

  // 删除任务
  async deleteTask(userId: number, taskId: number) {
    // 删除关联的task_tag
    const { error: tagError } = await this.supabase.from('task_tag').delete().eq('taskId', taskId);
    if (tagError) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '删除任务标签关联失败');
    }
    // 删除任务
    const { error } = await this.supabase.from('task').delete().eq('id', taskId).eq('userId', userId);
    if (error) {
      console.log(error);

      throw new CustomException(ErrorCode.INTERNAL_ERROR, '删除任务失败');
    }
  }

  // 更新任务状态
  async updateTaskStatus(userId: number, taskId: number, status: number) {
    const { error } = await this.supabase.from('task').update({ status }).eq('id', taskId).eq('userId', userId);
    if (error) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新任务状态失败');
    }
  }
}
