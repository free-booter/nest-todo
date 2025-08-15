import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { handleHtmlMail } from './config';
import { CreateEmailDto } from './dto/create-email.dto';
import { SupabaseService } from 'src/common/services/supabase.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // 发送邮件
  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: '1596861254@qq.com',
      to: email,
      subject: '验证码',
      html: handleHtmlMail(code),
    };
    await this.transporter.sendMail(mailOptions);
    // 生成过期时间
    const expirationTime = new Date(Date.now() + 10 * 60 * 100);
    // 将验证码和邮箱存入表中
    const response = await this.supabase.from('verification_codes').insert({
      email,
      code,
      expirationTime,
      used: false,
    });

    const { error } = response as { data: { id: number } | null; error: Error | null };
    if (error) throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    return null;
  }

  // 校验验证码
  async verifyVerificationCode(email: string, code: number) {
    const response = await this.supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .maybeSingle();
    const { data, error } = response as { data: CreateEmailDto | null; error: Error | null };
    if (error) throw new CustomException(ErrorCode.INTERNAL_ERROR, error.message);
    if (!data) throw new CustomException(ErrorCode.NOT_FOUND, '验证码不存在');
    if (data.used) throw new CustomException(ErrorCode.PARAMS_ERROR, '验证码已使用');
    // 处理时间
    const expirationTime = new Date(data.expirationTime as string).getTime();
    if (expirationTime < Date.now()) throw new CustomException(ErrorCode.PARAMS_ERROR, '验证码已过期');
    // 更新验证码状态
    const { error: updateError } = await this.supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('code', code);
    if (updateError) throw new CustomException(ErrorCode.INTERNAL_ERROR, updateError.message);
    return true;
  }
}
