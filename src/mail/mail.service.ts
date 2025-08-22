import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { handleHtmlMail } from './config';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationCodes } from '../entities/mail.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  constructor(
    @InjectRepository(VerificationCodes)
    private readonly MailRepository: Repository<VerificationCodes>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'qq', // 使用 QQ 邮箱服务
      auth: {
        user: '1596861254@qq.com', // 发件人邮箱
        pass: 'fvnzfbbtihyobaeg', // 邮箱授权码
      },
    });
  }

  // 发送邮件
  async sendVerificationCode(email: string, code: number) {
    const mailOptions = {
      from: '1596861254@qq.com',
      to: email,
      subject: '验证码',
      html: handleHtmlMail(code),
    };
    await this.transporter.sendMail(mailOptions);
    // 生成过期时间
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);
    // 将验证码和邮箱存入表中
    try {
      await this.MailRepository.save({
        email,
        code,
        expirationTime,
        used: false,
      });
    } catch (error: any) {
      console.error('Error saving verification code:', error);
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '发送失败');
    }
    return null;
  }

  // 校验验证码
  async verifyVerificationCode(email: string, code: number) {
    const record = await this.MailRepository.findOne({
      where: { email, code },
    });
    if (!record) throw new CustomException(ErrorCode.NOT_FOUND, '验证码不存在');
    if (record.used) throw new CustomException(ErrorCode.PARAMS_ERROR, '验证码已使用');
    // 处理时间
    const expirationTime = new Date(record.expirationTime).getTime();
    if (expirationTime < Date.now()) throw new CustomException(ErrorCode.PARAMS_ERROR, '验证码已过期');
    // 更新验证码状态
    try {
      await this.MailRepository.update({ email, code }, { used: true });
    } catch (updateError: any) {
      console.log(updateError);
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '操作失败');
    }
    return true;
  }
}
