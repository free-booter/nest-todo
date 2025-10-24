import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { TaskEntity } from 'src/entities/task.entity';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskTagEntity } from 'src/entities/taskTag.entity';
import { StatusMapper, TaskStatusMap } from 'src/common/constants/status-mapper';
import dayjs from 'dayjs';
import { QueryTaskDto } from './dto/query-task.dto';
import { TaskStatus } from './types';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(TaskTagEntity)
    private readonly taskTagRepository: Repository<TaskTagEntity>,
  ) {}

  // 判断任务是否逾期
  private isTaskOverdue(task: TaskEntity): boolean {
    if (!task.dueDate) return false;
    if (task.status !== StatusMapper.taskStatusToNumber('done')) {
      // 过期判断：当前时间是否晚于截止日期的23:59:59
      return dayjs().isAfter(dayjs(task.dueDate).endOf('day')) ? true : false;
    }
    if (task.status === StatusMapper.taskStatusToNumber('done') && task.finishedAt) {
      return dayjs().isAfter(dayjs(task.dueDate).add(1, 'day').subtract(1, 'second')) ? true : false;
    }
    return false;
  }

  // 创建任务
  async create(createTaskDto: CreateTaskDto & { userId: number }): Promise<any> {
    const { tagIds = [], ...taskData } = createTaskDto;

    try {
      // 将前端字符串状态映射为数据库数字状态
      const statusNumber = StatusMapper.taskStatusToNumber(taskData.status as string);

      // 准备保存的数据
      const saveData: Partial<TaskEntity> = {
        ...taskData,
        status: statusNumber,
        priority: StatusMapper.priorityToNumber(taskData.priority as string),
        dateType: StatusMapper.dateTypeToNumber(taskData.dateType as string),
        remindType: taskData.remindType ? StatusMapper.remindTypeToNumber(taskData.remindType as string) : undefined,
        repeatType: taskData.repeatType ? StatusMapper.repeatTypeToNumber(taskData.repeatType as string) : undefined,
      };

      // 根据初始状态设置时间节点
      const now = new Date();
      if (statusNumber === StatusMapper.taskStatusToNumber('inprogress')) {
        // 如果创建时就是进行中状态，设置开始时间
        saveData.startedAt = now;
      } else if (statusNumber === StatusMapper.taskStatusToNumber('done')) {
        // 如果创建时就是完成状态，设置开始和完成时间
        saveData.startedAt = now;
        saveData.finishedAt = now;
      }

      // 根据 dateType 自动计算结束日期
      const noneType = StatusMapper.dateTypeToNumber('none');
      const todayType = StatusMapper.dateTypeToNumber('today');
      const tomorrowType = StatusMapper.dateTypeToNumber('tomorrow');

      if (saveData.dateType !== noneType) {
        if (saveData.dateType === todayType) {
          saveData.dueDate = dayjs().format('YYYY-MM-DD');
        } else if (saveData.dateType === tomorrowType) {
          saveData.dueDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
        }
      }

      // 创建任务实体
      const savedTask = await this.taskRepository.save(saveData);

      // 处理标签关联
      if (tagIds && tagIds.length > 0) {
        const taskTagEntities = tagIds.map((tagId) => ({
          taskId: savedTask.id,
          tagId: tagId,
        }));
        await this.taskTagRepository.save(taskTagEntities);
      }

      return this.getTaskDetail(saveData.userId, savedTask.id);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('无效的')) {
        throw new CustomException(ErrorCode.PARAMS_ERROR, error.message);
      }
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '创建任务失败');
    }
  }

  // 更新任务状态并记录时间节点
  async updateTaskStatus(userId: number, taskId: number, newStatus: string): Promise<any> {
    try {
      // 检查任务是否存在
      const existingTask = await this.taskRepository.findOne({
        where: { id: taskId, userId },
      });

      if (!existingTask) {
        throw new CustomException(ErrorCode.NOT_FOUND, '任务不存在');
      }

      const oldStatusNumber = existingTask.status;
      const newStatusNumber = StatusMapper.taskStatusToNumber(newStatus);

      // 如果状态没有变化，直接返回
      if (oldStatusNumber === newStatusNumber) {
        return this.getTaskDetail(userId, taskId);
      }

      const now = new Date();
      const updateData: Partial<TaskEntity> = {
        status: newStatusNumber,
      };

      // 根据状态变化设置时间节点
      const todoStatus = StatusMapper.taskStatusToNumber('todo');
      const inprogressStatus = StatusMapper.taskStatusToNumber('inprogress');
      const doneStatus = StatusMapper.taskStatusToNumber('done');

      // 状态变化逻辑
      if (newStatusNumber === inprogressStatus && oldStatusNumber === todoStatus) {
        // todo -> inprogress: 设置开始时间
        updateData.startedAt = now;
        updateData.pausedAt = null; // 清除暂停时间
      } else if (newStatusNumber === doneStatus) {
        // 任何状态 -> done: 设置完成时间
        updateData.finishedAt = now;
        // 如果之前没有开始时间，也设置开始时间
        if (!existingTask.startedAt) {
          updateData.startedAt = now;
        }
      } else if (newStatusNumber === todoStatus && oldStatusNumber === inprogressStatus) {
        // inprogress -> todo: 设置暂停时间
        updateData.pausedAt = now;
        updateData.finishedAt = null; // 清除完成时间
      } else if (newStatusNumber === inprogressStatus && oldStatusNumber === doneStatus) {
        // done -> inprogress: 重新开始，清除完成时间
        updateData.finishedAt = null;
        updateData.startedAt = now; // 重新设置开始时间
      }

      // 更新任务
      await this.taskRepository.update({ id: taskId, userId }, updateData);

      return this.getTaskDetail(userId, taskId);
    } catch (error: unknown) {
      if (error instanceof CustomException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('无效的')) {
        throw new CustomException(ErrorCode.PARAMS_ERROR, error.message);
      }
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新任务状态失败');
    }
  }

  // 获取任务详情（返回前端需要的字符串格式）
  async getTaskDetail(userId: number, taskId: number): Promise<any> {
    const task = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.taskTag', 'taskTag')
      .leftJoinAndSelect('taskTag.tag', 'tag')
      .where('task.id = :taskId', { taskId })
      .andWhere('task.userId = :userId', { userId })
      .getOne();

    if (!task) {
      throw new CustomException(ErrorCode.NOT_FOUND, '任务不存在');
    }
    // 判断任务是否逾期
    const isOverdue = this.isTaskOverdue(task);

    // 将数据库数字状态转换为前端字符串状态
    const result = {
      ...task,
      status: StatusMapper.taskStatusToString(task.status),
      priority: StatusMapper.priorityToString(task.priority),
      dateType: StatusMapper.dateTypeToString(task.dateType),
      remindType: task.remindType ? StatusMapper.remindTypeToString(task.remindType) : null,
      repeatType: task.repeatType ? StatusMapper.repeatTypeToString(task.repeatType) : null,
      tags: task.taskTag?.map((tt) => ({ value: tt.tag.id, label: tt.tag.name })) || [],
      // 状态时间节点信息
      timeline: {
        createdAt: task.createdAt ? dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss') : null,
        startedAt: task.startedAt ? dayjs(task.startedAt).format('YYYY-MM-DD HH:mm:ss') : null,
        pausedAt: task.pausedAt ? dayjs(task.pausedAt).format('YYYY-MM-DD HH:mm:ss') : null,
        finishedAt: task.finishedAt ? dayjs(task.finishedAt).format('YYYY-MM-DD HH:mm:ss') : null,
        updatedAt: dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      },
      isOverdue,
    };

    delete result.taskTag;
    return result;
  }

  // 获取任务列表
  async getTaskList(userId: number, queryTaskDto: QueryTaskDto): Promise<any> {
    const { current = 1, size = 10, keyword, status, priority, tagId, isOverdue, today } = queryTaskDto;

    // 构建基础查询
    let query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.taskTag', 'taskTag')
      .leftJoinAndSelect('taskTag.tag', 'tag')
      .where('task.userId = :userId', { userId });

    // 添加过滤条件
    if (status !== undefined) {
      const statusNumber = StatusMapper.taskStatusToNumber(status);
      query = query.andWhere('task.status = :status', { status: statusNumber });
    }

    if (priority !== undefined) {
      query = query.andWhere('task.priority = :priority', { priority });
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      query = query.andWhere('(task.title LIKE :likeKeyword OR task.description LIKE :likeKeyword)', { likeKeyword });
    }

    if (tagId) {
      query = query.andWhere('taskTag.tagId = :tagId', { tagId });
    }

    const t = dayjs().format('YYYY-MM-DD');
    // 逾期任务[超出截止日期完成和未完成的任务]
    if (isOverdue) {
      query = query.andWhere(
        new Brackets((qb) => {
          // 未完成且截止日期 < 当前时间
          qb.where('task.status != :done AND task.dueDate < :now', {
            done: StatusMapper.taskStatusToNumber('done'),
            now: t,
          })
            // 已完成且完成时间 > 截止日期的当天 23:59:59
            .orWhere(
              'task.status = :done AND task.finishedAt > DATE_ADD(task.dueDate, INTERVAL 1 DAY) - INTERVAL 1 SECOND',
              { done: StatusMapper.taskStatusToNumber('done') },
            );
        }),
      );
    }
    // 到期时间为今天
    if (today) {
      query = query.andWhere(
        new Brackets((qb) => {
          qb.where('task.dueDate = :today', { today: t }).orWhere(
            'task.startDate <= :today AND task.dueDate >= :today',
            {
              today: t,
            },
          );
        }),
      );
    }

    // 分页和排序
    const from = (current - 1) * size;
    query = query
      .orderBy('task.priority', 'DESC') // 优先级高的在前
      .addOrderBy('task.dueDate', 'ASC') // 日期早的在前
      .addOrderBy('task.createdAt', 'DESC') // 创建时间新的在前
      .skip(from)
      .take(size);

    const [taskData, total] = await query.getManyAndCount();

    const result = {
      list:
        taskData?.map((item) => ({
          ...item,
          status: StatusMapper.taskStatusToString(item.status),
          priority: StatusMapper.priorityToString(item.priority),
          dateType: StatusMapper.dateTypeToString(item.dateType),
          tags: item.taskTag?.map((tt) => tt.tag) || [],
          isOverdue: this.isTaskOverdue(item),
          timeline: {
            createdAt: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            startedAt: item.startedAt ? dayjs(item.startedAt).format('YYYY-MM-DD HH:mm:ss') : null,
            finishedAt: item.finishedAt ? dayjs(item.finishedAt).format('YYYY-MM-DD HH:mm:ss') : null,
          },
        })) || [],
      current,
      size,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / size),
    };
    return result;
  }

  // 获取3种任务列表
  async getTaskAllList(userId: number, queryTaskDto: QueryTaskDto): Promise<any> {
    const promiseArr = Object.values(TaskStatusMap.NUMBER_TO_STRING)
      .filter((v) => typeof v === 'string')
      .map((item) => {
        return this.getTaskList(userId, { ...queryTaskDto, status: item as TaskStatus });
      });
    const data = await Promise.all(promiseArr);
    return data;
  }

  // 更新任务详情
  async updateTaskDetail(userId: number, updateTaskDto: UpdateTaskDto): Promise<any> {
    const { id, ...taskData } = updateTaskDto;
    // 查找任务是否存在
    const task = await this.taskRepository.findOne({ where: { id, userId } });
    if (!task) {
      throw new CustomException(ErrorCode.NOT_FOUND, '任务不存在');
    }
    // 更新任务
    try {
      await this.taskRepository.update(id, {
        ...taskData,
        status: StatusMapper.taskStatusToNumber(taskData.status as string),
        priority: StatusMapper.priorityToNumber(taskData.priority as string),
        dateType: StatusMapper.dateTypeToNumber(taskData.dateType as string),
        remindType: taskData.remindType ? StatusMapper.remindTypeToNumber(taskData.remindType as string) : undefined,
        repeatType: taskData.repeatType ? StatusMapper.repeatTypeToNumber(taskData.repeatType as string) : undefined,
      });
      return this.getTaskDetail(userId, id);
    } catch (error) {
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新任务详情失败');
    }
  }

  // 删除任务
  async deleteTask(userId: number, taskId: number): Promise<any> {
    try {
      const task = await this.taskRepository.findOne({ where: { id: taskId, userId } });
      if (!task) {
        throw new CustomException(ErrorCode.NOT_FOUND, '任务不存在');
      }
      await this.taskRepository.delete(taskId);
      return { message: '删除任务成功' };
    } catch (error) {
      console.log(error);
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '删除任务失败');
    }
  }
}
