import { Module } from '@nestjs/common';
import { TasksController } from './task.controller';
import { TasksService } from './task.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from '../common/services/supabase.service';

@Module({
  imports: [ConfigModule],
  controllers: [TasksController], // 注册控制器
  providers: [TasksService, SupabaseService], // 注册服务
  exports: [TasksService], // （可选）导出服务给其他模块用
})
export class TaskModule {}
