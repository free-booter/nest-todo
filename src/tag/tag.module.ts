import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from 'src/common/services/supabase.service';

@Module({
  imports: [ConfigModule],
  controllers: [TagController], // 注册控制器
  providers: [TagService, SupabaseService], // 注册服务
  exports: [TagService], // （可选）导出服务给其他模块用
})
export class TagModule {}
