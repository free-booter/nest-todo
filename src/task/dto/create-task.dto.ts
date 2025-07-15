// 数据传输对象
import { PartialType } from '@nestjs/mapped-types';

export class CreateTaskDto {
  title: string; // 任务名称
  description?: string; // 任务描述（可选）
  priority: number; // 优先级 (1: 高, 2: 中, 3: 低)

  // 时间相关
  date_type: number; // 时间类型 (1: 今天, 2: 明天, 3: 指定日期, 4: 时间段, 5: 无截止日期)
  start_date?: Date; // 开始日期（可选）
  end_date?: Date; // 结束日期（可选）
  specific_time?: string; // 具体时间点（可选）

  // 提醒相关
  remind_type: number; // 提醒类型
  advance_type?: number; // 自定义提醒类型（可选）
  advance_value?: number; // 提前时间值（可选）
  remind_time: string; // 提醒时间点

  // 重复相关
  repeat_type: number; // 重复类型

  // 标签相关
  tag_ids?: number[]; // 标签ID数组（可选）
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  status?: number; // 任务状态 (1: 待办, 2: 进行中, 3: 已完成)
}

export class QueryTaskDto {
  status?: number; // 按状态筛选
  priority?: number; // 按优先级筛选
  date_type?: number; // 按时间类型筛选
  tag_ids?: number[]; // 按标签筛选
  search?: string; // 搜索关键词
  sort_by?: string; // 排序字段
  sort_order?: 'asc' | 'desc'; // 排序方向
  page?: number; // 页码
  limit?: number; // 每页数量
}
