import { Module } from '@nestjs/common';
import { TasksController } from './task.controller';
import { TasksService } from './task.service';
import { SupabaseService } from '../common/services/supabase.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from 'src/entities/task.entities';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity])],
  controllers: [TasksController], // 注册控制器
  providers: [TasksService, SupabaseService], // 注册服务
  exports: [TasksService], // （可选）导出服务给其他模块用
})
export class TaskModule {}
