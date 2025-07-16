import { Controller, Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { MailService } from './mail.service';
import * as randomstring from 'randomstring';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  sendVerificationCode(@Body() body: { email: string }) {
    // 生成随机的6位数code
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const code = randomstring.generate({
      length: 6,
      charset: 'numeric',
    }) as string;
    return this.mailService.sendVerificationCode(body.email, code);
  }

  @Post('verify')
  verify(@Body() body: { email: string; code: string }) {
    return this.mailService.verifyVerificationCode(body.email, body.code);
  }
}
