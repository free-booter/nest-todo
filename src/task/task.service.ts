import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateTaskDto, QueryTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = configService.getOrThrow<string>('SUPABASE_URL');
    const key = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(url, key);
  }

  // 创建任务
  async create(createTaskDto: CreateTaskDto): Promise<any> {
    const { tag_ids, ...taskData } = createTaskDto;

    const response = await this.supabase.from('tasks').insert(taskData).select().single();
    const { data, error: taskError } = response as { data: { id: number } | null; error: Error | null };

    if (taskError) throw taskError;
    if (!data) throw new Error('Task creation failed');
    const task = data;

    // 如果有标签，创建关联
    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const taskTags = tag_ids.map((tag_id: number) => ({
        task_id: task.id,
        tag_id,
      }));

      const { error: tagError } = await this.supabase.from('task_tags').insert(taskTags);
      if (tagError) throw tagError;
    }

    return task;
  }
  // 查询任务
  async findAll(queryTaskDto: QueryTaskDto): Promise<any> {
    const { status, priority, date_type, tag_ids, search, sort_by, sort_order, page, limit } = queryTaskDto;
    console.log(queryTaskDto);
    const query = this.supabase.from('task').select('*');
    if (status) query.eq('status', status);
    if (priority) query.eq('priority', priority);
    if (date_type) query.eq('date_type', date_type);
    if (tag_ids) query.in('tag_ids', tag_ids);
    if (search) query.ilike('title', `%${search}%`);
    if (sort_by) query.order(sort_by, { ascending: sort_order === 'asc' });
    if (page && limit) query.range((page - 1) * limit, page * limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
