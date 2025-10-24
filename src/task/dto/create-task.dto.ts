// 数据传输对象
import { DateType, TaskPriority, RemindType, RepeatType, TaskStatus } from '../types';
import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional, IsNumber, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotPastDate, IsAfterStartDate, IsWithinDays } from '../../common/decorators/date-validation.decorator';

export class CreateTaskDto {
  @ApiProperty({ description: '任务标题' })
  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @ApiProperty({ description: '任务描述' })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description: string;

  @ApiProperty({ description: '任务状态', enum: TaskStatus })
  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  status: TaskStatus;

  @ApiProperty({ description: '任务优先级', enum: TaskPriority })
  @IsEnum(TaskPriority, { message: '无效的优先级' })
  priority: TaskPriority;

  // * 日期相关
  @ApiProperty({ description: '日期类型', enum: DateType })
  @IsEnum(DateType, { message: '无效的日期类型' })
  dateType: DateType;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDateString({}, { message: '无效的开始日期格式' })
  @IsNotPastDate({ message: '开始日期不能是过去的日期' })
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDateString({}, { message: '无效的结束日期格式' })
  @IsNotPastDate({ message: '截止日期不能是过去的日期' })
  @IsAfterStartDate('startDate', { message: '截止日期必须晚于开始日期' })
  @IsWithinDays(365, { message: '截止日期不能超过一年后' })
  dueDate?: string;

  // 标签关联
  @ApiProperty({ description: '标签ID数组' })
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  tagIds: number[];

  // 提醒设置
  @ApiProperty({ description: '提醒类型', enum: RemindType, required: false })
  @IsOptional()
  @IsEnum(RemindType, { message: '无效的提醒类型' })
  remindType?: RemindType;

  @ApiProperty({ description: '提醒时间', required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '提醒时间格式必须为 HH:mm' })
  remindTime?: string;

  @ApiProperty({ description: '提前提醒类型', required: false })
  @IsOptional()
  @IsNumber({}, { message: '提醒值必须是数字' })
  advanceType?: number;

  @ApiProperty({ description: '提前提醒数值', required: false })
  @IsOptional()
  @IsNumber({}, { message: '提醒值必须是数字' })
  advanceValue?: number;

  // 重复设置
  @ApiProperty({ description: '重复类型', enum: RepeatType, required: false })
  @IsOptional()
  @IsEnum(RepeatType, { message: '无效的重复类型' })
  repeatType?: RepeatType;
}
