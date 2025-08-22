import { Module } from '@nestjs/common';
import { UserController } from './user.comtroller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController], // 注册控制器
  providers: [UserService], // 注册服务
  exports: [UserService], // （可选）导出服务给其他模块用
})
export class UserModule {}
