import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class DetailTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: '任务ID', required: true })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsNumber({}, { message: '任务ID必须是数字' })
  id: number;

  @ApiProperty({ description: '是否逾期', required: false })
  @IsOptional()
  isOverdue: boolean;

  @ApiProperty({ description: '完成时间', required: false })
  @IsOptional()
  finishedAt: Date;

  @ApiProperty({ description: '创建时间', required: false })
  @IsOptional()
  createdAt: Date;

  @ApiProperty({ description: '更新时间', required: false })
  @IsOptional()
  updatedAt: Date;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  order: number;
}
