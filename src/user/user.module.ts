import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './user.comtroller';
import { UserService } from './user.service';

@Module({
  imports: [ConfigModule],
  controllers: [UserController], // 注册控制器
  providers: [UserService], // 注册服务
  exports: [UserService], // （可选）导出服务给其他模块用
})
export class UserModule {}
