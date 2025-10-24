import { Controller, Post, Body, UseGuards, Req, Patch, Param, Get, Put, Delete, Query } from '@nestjs/common';
import { TasksService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { UserRequest } from 'src/user/interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from './types';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// 状态更新 DTO
class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, { message: '无效的任务状态' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: TaskStatus;
}

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

  @Patch(':id/status')
  @ApiOperation({ summary: '更新任务状态' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') taskId: number, @Body() updateStatusDto: UpdateTaskStatusDto, @Req() req: UserRequest) {
    const userId = req.user.id;
    return this.tasksService.updateTaskStatus(userId, taskId, updateStatusDto.status);
  }

  @Post('list')
  @ApiOperation({ summary: '获取任务列表' })
  @UseGuards(JwtAuthGuard)
  getTaskList(@Body() queryTaskDto: QueryTaskDto, @Req() req: UserRequest) {
    const userId = req.user.id;
    return this.tasksService.getTaskList(userId, queryTaskDto);
  }

  // 获取3中类型的todo
  @Post('list/all')
  @ApiOperation({ summary: '获取3种任务列表' })
  @UseGuards(JwtAuthGuard)
  getTaskAllList(@Body() queryTaskDto: QueryTaskDto, @Req() req: UserRequest) {
    const userId = req.user.id;
    return this.tasksService.getTaskAllList(userId, queryTaskDto);
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
  updateTask(@Body() updateTaskDto: UpdateTaskDto, @Req() req: UserRequest) {
    return this.tasksService.updateTaskDetail(req.user.id, updateTaskDto);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除任务' })
  @UseGuards(JwtAuthGuard)
  deleteTask(@Query('id') id: number, @Req() req: UserRequest) {
    return this.tasksService.deleteTask(req.user.id, id);
  }

  // @Put('updateStatus')
  // @ApiOperation({ summary: '更新任务状态' })
  // @UseGuards(JwtAuthGuard)
  // async updateTaskStatus(@Body() updateTaskStatusDto: UpdateTaskDto, @Req() req: UserRequest) {
  //   return this.tasksService.updateTaskStatus(req.user.id, updateTaskStatusDto.id, updateTaskStatusDto.status);
  // }

  // @Get('statistic')
  // @ApiOperation({ summary: '获取任务统计数据' })
  // @UseGuards(JwtAuthGuard)
  // async getTaskStats(@Req() req: UserRequest) {
  //   return await this.tasksService.getTaskStats(req.user.id);
  // }

  // @Get('calendar')
  // @ApiOperation({ summary: '按日期范围/月份获取日历事件' })
  // @UseGuards(JwtAuthGuard)
  // async getCalendar(@Query() query: CalendarQueryDto, @Req() req: UserRequest) {
  //   return this.tasksService.getCalendarTasks(req.user.id, query);
  // }
}
