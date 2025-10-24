import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskModule } from './task/task.module';
import { TagModule } from './tag/tag.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块
    }),

    MailModule,
    AuthModule,
    UserModule,
    TaskModule,
    TagModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', process.env.DB_HOST),
        port: parseInt(configService.get<string>('DB_PORT', process.env.DB_PORT), 10),
        username: configService.get<string>('DB_USERNAME', process.env.DB_USERNAME),
        password: configService.get<string>('DB_PASSWORD', process.env.DB_PASSWORD),
        database: configService.get<string>('DB_DATABASE', process.env.DB_DATABASE),
        // 依赖 autoLoadEntities，避免与当前非 *.entity.ts 命名冲突
        autoLoadEntities: true,
        // 生产环境关闭自动同步
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        retryDelay: 500,
        retryAttempts: 10,
        logging: ['error'],
        charset: 'utf8mb4',
      }),
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
