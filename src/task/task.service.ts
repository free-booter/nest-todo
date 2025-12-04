import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { TaskEntity } from 'src/entities/task.entity';
import { Brackets, Repository, EntityManager } from 'typeorm';
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

      // order越大排在前面，新增任务给最大值
      // 获取用户的所有任务，用于计算唯一的order值
      const allUserTasks = await this.taskRepository.find({
        where: { userId: saveData.userId },
        order: { order: 'DESC' },
      });

      // 计算候选order值：如果有任务，使用最大order值+1000；否则使用默认值1000000
      const candidateOrder = allUserTasks.length > 0 ? allUserTasks[0].order + 1000 : 1000000;

      // 确保order值唯一，不与现有任务重复
      saveData.order = this.ensureUniqueOrder(candidateOrder, allUserTasks);

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

  // 拖拽更新任务排序
  async updateTaskOrder(
    userId: number,
    draggedTaskId: number,
    dropId: number | null,
    dropStatus: TaskStatus,
  ): Promise<any> {
    try {
      // 查找被拖拽的任务是否存在
      const draggedTask = await this.taskRepository.findOne({
        where: { id: draggedTaskId, userId },
      });
      if (!draggedTask) {
        throw new CustomException(ErrorCode.NOT_FOUND, '被拖拽的任务不存在');
      }

      const newStatusNumber = StatusMapper.taskStatusToNumber(dropStatus);

      // 使用事务确保数据一致性
      await this.taskRepository.manager.transaction(async (manager) => {
        // 1. 获取用户的所有任务，按order排序（全局排序，不区分状态列）
        const allTasks = await manager.find(TaskEntity, {
          where: { userId },
          order: { order: 'DESC' }, // order越大排在前面
        });

        // 排除被拖拽的任务，避免影响计算
        const tasksWithoutDragged = allTasks.filter((task) => task.id !== draggedTaskId);

        // 2. 计算新的order值（基于全局所有任务）
        let newOrder: number;

        if (dropId === null || dropId === undefined) {
          // 拖放到列的最顶部
          const targetStatusTasks = tasksWithoutDragged.filter(
            (task) => StatusMapper.taskStatusToString(task.status) === dropStatus.toString(),
          );
          if (targetStatusTasks.length === 0) {
            // 该状态列没有任务，基于全局所有任务计算order值
            if (tasksWithoutDragged.length === 0) {
              // 用户没有任何其他任务，检查被拖拽任务的当前order值
              // 如果被拖拽任务的order值小于1000000，使用1000000；否则在其基础上加1000
              const candidateOrder = draggedTask.order < 1000000 ? 1000000 : draggedTask.order + 1000;
              newOrder = this.ensureUniqueOrder(candidateOrder, allTasks, draggedTaskId);
            } else {
              // 用户有其他任务，放到全局最前面，比最大order值大1000
              const maxOrder = tasksWithoutDragged[0].order;
              const candidateOrder = maxOrder + 1000;
              newOrder = this.ensureUniqueOrder(candidateOrder, allTasks, draggedTaskId);
            }
          } else {
            // 找到目标状态列中order最大的任务，然后基于全局计算
            const maxOrderInTargetStatus = targetStatusTasks[0].order;
            // 找到全局中order大于maxOrderInTargetStatus的第一个任务（因为DESC排序，order大的在前面）
            const globalPrevTask = tasksWithoutDragged.find((task) => task.order > maxOrderInTargetStatus);
            if (!globalPrevTask) {
              // 目标状态列的任务已经是全局最大的，放到最前面
              const candidateOrder = maxOrderInTargetStatus + 1000;
              newOrder = this.ensureUniqueOrder(candidateOrder, allTasks, draggedTaskId);
            } else {
              // 插入到全局PrevTask和目标状态列最大任务之间
              const minGap = 0.1;
              if (globalPrevTask.order - maxOrderInTargetStatus < minGap) {
                // 间距太小，需要重排
                const insertIndex = tasksWithoutDragged.findIndex((task) => task.id === targetStatusTasks[0].id);
                await this.rebalanceAllTaskOrders(manager, userId, draggedTask, newStatusNumber, insertIndex);
                return;
              }
              const candidateOrder = (globalPrevTask.order + maxOrderInTargetStatus) / 2;
              newOrder = this.ensureUniqueOrder(candidateOrder, allTasks, draggedTaskId);
            }
          }
        } else {
          // 拖放到指定任务的上方（基于全局位置）
          const dropTask = tasksWithoutDragged.find((task) => task.id === dropId);
          if (!dropTask) {
            throw new CustomException(ErrorCode.NOT_FOUND, '拖放目标任务不存在');
          }

          // 找到dropTask在全局所有任务中的位置
          const dropTaskGlobalIndex = tasksWithoutDragged.findIndex((task) => task.id === dropId);

          if (dropTaskGlobalIndex === 0) {
            // 插入到全局第一个任务前面
            const candidateOrder = dropTask.order + 1000;
            newOrder = this.ensureUniqueOrder(candidateOrder, allTasks, draggedTaskId);
          } else {
            // 插入到两个任务之间（全局位置）
            const prevTask = tasksWithoutDragged[dropTaskGlobalIndex - 1];
            const currentTask = tasksWithoutDragged[dropTaskGlobalIndex];
            const minGap = 0.1; // 最小间距
            if (prevTask.order - currentTask.order < minGap) {
              // 间距太小，需要重排所有任务
              await this.rebalanceAllTaskOrders(manager, userId, draggedTask, newStatusNumber, dropTaskGlobalIndex);
              return;
            }
            const candidateOrder = (prevTask.order + currentTask.order) / 2;
            newOrder = this.ensureUniqueOrder(candidateOrder, allTasks, draggedTaskId);
          }
        }

        // 3. 处理状态变化的时间节点
        const now = new Date();
        const statusChanged = draggedTask.status !== newStatusNumber;
        const updateData: Partial<TaskEntity> = {
          order: newOrder,
          status: newStatusNumber,
        };

        if (statusChanged) {
          this.processStatusChangeForDraggedTask(draggedTask, newStatusNumber, updateData, now);
        }

        // 4. 更新被拖拽的任务
        await manager.update(TaskEntity, draggedTaskId, updateData);
      });

      return this.getTaskDetail(userId, draggedTaskId);
    } catch (error) {
      if (error instanceof CustomException) {
        throw error;
      }
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '拖拽更新任务排序失败');
    }
  }

  // 辅助函数：确保order值唯一，不与现有任务的order值重复
  private ensureUniqueOrder(candidateOrder: number, existingTasks: TaskEntity[], excludeTaskId?: number): number {
    // 收集所有现有任务的order值（排除指定任务）
    const allExistingOrders = new Set(
      existingTasks.filter((task) => !excludeTaskId || task.id !== excludeTaskId).map((task) => task.order),
    );

    // 如果候选值已存在，递增直到找到唯一值
    // 使用浮点数比较的容差值，避免精度问题
    const epsilon = 0.0001;
    let uniqueOrder = candidateOrder;
    let attempts = 0;
    const maxAttempts = 1000; // 防止无限循环

    while (attempts < maxAttempts) {
      // 检查是否有任何现有order值与候选值相等（考虑浮点数精度）
      const isDuplicate = Array.from(allExistingOrders).some((existingOrder) => {
        return Math.abs(existingOrder - uniqueOrder) < epsilon;
      });

      if (!isDuplicate) {
        break;
      }

      // 如果重复，递增1000
      uniqueOrder += 1000;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // 如果尝试次数过多，返回一个非常大的值
      uniqueOrder = Math.max(...Array.from(allExistingOrders), 1000000) + 1000000;
    }

    return uniqueOrder;
  }

  // 重新平衡所有任务的order值（全局重排）
  private async rebalanceAllTaskOrders(
    manager: EntityManager,
    userId: number,
    draggedTask: TaskEntity,
    newStatusNumber: number,
    insertIndex: number,
  ): Promise<void> {
    // 获取用户的所有任务（除了要插入的任务），按order排序
    const allTasks = await manager.find(TaskEntity, {
      where: { userId },
      order: { order: 'DESC' },
    });

    // 移除要插入的任务
    const tasksWithoutInserted = allTasks.filter((task: TaskEntity) => task.id !== draggedTask.id);

    // 在指定位置插入任务占位符
    const reorderedTasks = [...tasksWithoutInserted];
    reorderedTasks.splice(insertIndex, 0, draggedTask);

    // 重新分配所有任务的order值（全局唯一）
    const baseOrder = 1000000;
    const increment = 1000;

    const now = new Date();
    const statusChanged = draggedTask.status !== newStatusNumber;

    const updatePromises = reorderedTasks.map((task, index) => {
      const newOrder = baseOrder + (reorderedTasks.length - index - 1) * increment;

      // 如果是被拖拽的任务，需要同时更新状态和处理状态变化
      if (task.id === draggedTask.id) {
        const updateData: Partial<TaskEntity> = {
          order: newOrder,
          status: newStatusNumber,
        };

        if (statusChanged) {
          this.processStatusChangeForDraggedTask(draggedTask, newStatusNumber, updateData, now);
        }

        return manager.update(TaskEntity, task.id, updateData);
      } else {
        // 其他任务只更新order值
        return manager.update(TaskEntity, task.id, { order: newOrder });
      }
    });

    await Promise.all(updatePromises);
  }

  // 处理拖拽任务的状态变化时间节点
  private processStatusChangeForDraggedTask(
    draggedTask: TaskEntity,
    newStatus: number,
    updateData: Partial<TaskEntity>,
    now: Date,
  ): void {
    const oldStatusNumber = draggedTask.status;
    const todoStatus = StatusMapper.taskStatusToNumber('todo');
    const inprogressStatus = StatusMapper.taskStatusToNumber('inprogress');
    const doneStatus = StatusMapper.taskStatusToNumber('done');

    // 状态变化逻辑
    if (newStatus === inprogressStatus && oldStatusNumber === todoStatus) {
      updateData.startedAt = now;
      updateData.pausedAt = null;
    } else if (newStatus === doneStatus) {
      updateData.finishedAt = now;
      if (!draggedTask.startedAt) {
        updateData.startedAt = now;
      }
    } else if (newStatus === todoStatus && oldStatusNumber === inprogressStatus) {
      updateData.pausedAt = now;
      updateData.finishedAt = null;
    } else if (newStatus === inprogressStatus && oldStatusNumber === doneStatus) {
      updateData.finishedAt = null;
      updateData.startedAt = now;
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
      remindType: StatusMapper.remindTypeToString(task.remindType),
      repeatType: StatusMapper.repeatTypeToString(task.repeatType),
      tags: task.taskTag?.map((tt) => ({ value: tt.tag.id, label: tt.tag.name })) || [],
      // 状态时间节点信息
      timeLine: {
        createdAt: task.createdAt ? dayjs(task.createdAt).format('YYYY-MM-DD HH:mm:ss') : null, // 创建时间
        startedAt: task.startedAt ? dayjs(task.startedAt).format('YYYY-MM-DD HH:mm:ss') : null, // 开始时间
        pausedAt: task.pausedAt ? dayjs(task.pausedAt).format('YYYY-MM-DD HH:mm:ss') : null, // 暂停时间
        finishedAt: task.finishedAt ? dayjs(task.finishedAt).format('YYYY-MM-DD HH:mm:ss') : null, // 完成时间
        updatedAt: dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm:ss'), // 更新时间
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
      query = query.andWhere('task.priority = :priority', { priority: StatusMapper.priorityToNumber(priority) });
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
      .orderBy('task.order', 'DESC') // 排序大的在前
      .skip(from)
      .take(size);
    // query = query
    //   .orderBy('task.priority', 'DESC') // 优先级高的在前
    //   .addOrderBy('task.dueDate', 'ASC') // 日期早的在前
    //   .addOrderBy('task.createdAt', 'DESC') // 创建时间新的在前
    //   .skip(from)
    //   .take(size);

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
          timeLine: {
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

  // 获取全部任务、今日到期、已逾期、高优先级的任务数量
  async getTaskCounts(userId: number): Promise<any> {
    const taskCount = await this.taskRepository.count({ where: { userId } });
    const todayTaskCount = await this.taskRepository.count({
      where: { userId, dueDate: dayjs().format('YYYY-MM-DD') },
    });
    // 逾期任务统计：包含两种情况
    // 1. 已完成但完成时间晚于截止日期的 23:59:59
    // 2. 未完成且截止日期已过（小于今天）
    const today = dayjs().format('YYYY-MM-DD');
    const doneStatus = StatusMapper.taskStatusToNumber('done');
    const overdueTaskCount = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate IS NOT NULL')
      .andWhere(
        new Brackets((qb) => {
          // 情况1：已完成但完成时间晚于截止日期的 23:59:59
          qb.where(
            'task.status = :doneStatus AND task.finishedAt IS NOT NULL AND task.finishedAt > DATE_ADD(task.dueDate, INTERVAL 1 DAY) - INTERVAL 1 SECOND',
            { doneStatus },
          )
            // 情况2：未完成且截止日期已过（小于今天）
            .orWhere('task.status != :doneStatus AND task.dueDate < :today', {
              doneStatus,
              today,
            });
        }),
      )
      .getCount();
    const highPriorityTaskCount = await this.taskRepository.count({
      where: { userId, priority: StatusMapper.priorityToNumber('high') },
    });
    return {
      totalCount: taskCount,
      todayCount: todayTaskCount,
      overdueCount: overdueTaskCount,
      highPriorityCount: highPriorityTaskCount,
    };
  }
}
