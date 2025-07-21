import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '../types';
import { ApiProperty } from '@nestjs/swagger';

export class QueryTaskDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  current: number = 1;

  @ApiProperty({ description: '每页条数', required: false })
  @IsOptional()
  @IsNumber()
  size: number = 10;

  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword: string = '';

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ description: '优先级', required: false })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  // 标签
  @ApiProperty({ description: '标签', required: false })
  @IsOptional()
  @IsNumber()
  tagId: number;
}
