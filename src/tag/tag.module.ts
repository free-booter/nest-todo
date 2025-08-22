import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from '../entities/tag.entities';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  controllers: [TagController], // 注册控制器
  providers: [TagService], // 注册服务
  exports: [TagService], // （可选）导出服务给其他模块用
})
export class TagModule {}
