import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, Put, Delete } from '@nestjs/common';
import { TasksService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiOperation } from '@nestjs/swagger';
import { UserRequest } from 'src/user/interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('task')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('create')
  @ApiOperation({ summary: '创建任务' })
  @UseGuards(JwtAuthGuard)
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: UserRequest) {
    const userId = req.user.id;
    return this.tasksService.create({ ...createTaskDto, userId });
  }

  @Post('list')
  @ApiOperation({ summary: '获取任务列表' })
  @UseGuards(JwtAuthGuard)
  getTaskList(@Body() queryTaskDto: QueryTaskDto, @Req() req: UserRequest) {
    const userId = req.user.id;
    return this.tasksService.getTaskList(userId, queryTaskDto);
  }

  // 获取任务详情保持 GET
  @Get('detail/:id')
  @ApiOperation({ summary: '获取任务详情' })
  @UseGuards(JwtAuthGuard)
  getTaskDetail(@Param('id') id: number, @Req() req: UserRequest) {
    return this.tasksService.getTaskDetail(req.user.id, id);
  }

  @Put('update')
  @ApiOperation({ summary: '更新任务' })
  @UseGuards(JwtAuthGuard)
  async updateTask(@Body() updateTaskDto: UpdateTaskDto, @Req() req: UserRequest) {
    return this.tasksService.updateTask(req.user.id, updateTaskDto);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除任务' })
  @UseGuards(JwtAuthGuard)
  async deleteTask(@Query('id') id: number, @Req() req: UserRequest) {
    return this.tasksService.deleteTask(req.user.id, id);
  }
}
