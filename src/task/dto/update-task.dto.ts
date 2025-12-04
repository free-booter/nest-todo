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
  @ApiProperty({ description: '拖放目标任务ID，null表示放到列的最顶部', required: false, example: 123 })
  @IsOptional()
  @IsNumber({}, { message: 'dropId必须是数字' })
  dropId?: number;

  @ApiProperty({ description: '目标状态列', enum: TaskStatus, example: 'todo' })
  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  @IsNotEmpty({ message: '目标状态不能为空' })
  dropStatus: TaskStatus;
}

// 状态更新 DTO
export class UpdateTaskStatusDto {
  @ApiProperty({ description: '任务ID', required: true })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsNumber({}, { message: '任务ID必须是数字' })
  id: number;

  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: TaskStatus;
}
