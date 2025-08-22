import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
// import { SupabaseService } from 'src/common/services/supabase.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCodes } from '../entities/mail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCodes])],
  controllers: [MailController], // 注册控制器
  providers: [MailService], // 注册服务
  exports: [MailService], // （可选）导出服务给其他模块用
})
export class MailModule {}
