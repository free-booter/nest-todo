import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: '任务ID', required: true })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsNumber({}, { message: '任务ID必须是数字' })
  id: number;
}
