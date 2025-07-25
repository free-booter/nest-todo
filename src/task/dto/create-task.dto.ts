// 数据传输对象
import { TaskDateType, TaskPriority, TaskRemindType, TaskRepeatType, TaskStatus } from '../types';
import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional, IsNumber, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: '任务标题' })
  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @ApiProperty({ description: '任务描述' })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  // @IsNotEmpty({ message: '描述不能为空' })
  description: string;

  @ApiProperty({ description: '标签ID数组' })
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  // @ArrayNotEmpty({ message: '至少选择一个标签' })
  tagIds: number[];

  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  status: TaskStatus;

  @ApiProperty({ description: '任务优先级', enum: TaskPriority })
  @IsEnum(TaskPriority, { message: '无效的优先级' })
  priority: TaskPriority;

  // 到期时间设置
  @ApiProperty({ description: '日期类型', enum: TaskDateType })
  @IsEnum(TaskDateType, { message: '无效的日期类型' })
  dateType: TaskDateType;

  @ApiProperty({ description: '指定日期', required: false })
  @IsOptional()
  @IsDateString({}, { message: '无效的日期格式' })
  date: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDateString({}, { message: '无效的开始日期格式' })
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDateString({}, { message: '无效的结束日期格式' })
  endDate?: string;

  @ApiProperty({ description: '具体时间', required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '时间格式必须为 HH:mm' })
  specificTime?: string;

  // 提醒设置
  @ApiProperty({ description: '提醒类型', enum: TaskRemindType, required: false })
  @IsOptional()
  @IsEnum(TaskRemindType, { message: '无效的提醒类型' })
  remindType?: TaskRemindType;

  @ApiProperty({ description: '提前提醒数值', required: false })
  @IsOptional()
  @IsNumber({}, { message: '提醒值必须是数字' })
  remindValue?: number;

  @ApiProperty({ description: '提醒时间', required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '提醒时间格式必须为 HH:mm' })
  remindTime?: string;

  @ApiProperty({ description: '重复类型', enum: TaskRepeatType, required: false })
  @IsOptional()
  @IsEnum(TaskRepeatType, { message: '无效的重复类型' })
  repeatType?: TaskRepeatType;
}
