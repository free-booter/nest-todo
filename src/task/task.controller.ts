import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { TasksService } from './task.service';
import { CreateTaskDto, QueryTaskDto } from './dto/create-task.dto';

@Controller('task')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get('/list')
  findAll(@Query() queryTaskDto: QueryTaskDto) {
    return this.tasksService.findAll(queryTaskDto);
  }
}
