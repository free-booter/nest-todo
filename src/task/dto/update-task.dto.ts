import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { TaskStatus } from '../types';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: '任务ID', required: true })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsNumber({}, { message: '任务ID必须是数字' })
  id: number;
}

// 拖拽排序 DTO
export class UpdateTaskOrderDto {
  @IsNumber({}, { message: 'order必须是数字' })
  @IsNotEmpty({ message: 'order不能为空' })
  order: number;

  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: TaskStatus;

  @IsOptional()
  @IsNumber({}, { message: 'prevOrder必须是数字' })
  prevOrder?: number;
}

// 状态更新 DTO
export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: TaskStatus;
}
