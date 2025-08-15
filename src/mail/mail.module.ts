import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { SupabaseService } from 'src/common/services/supabase.service';

@Module({
  controllers: [MailController], // 注册控制器
  providers: [MailService, SupabaseService], // 注册服务
  exports: [MailService], // （可选）导出服务给其他模块用
})
export class MailModule {}
