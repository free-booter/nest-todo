import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
  @IsNotEmpty({ message: '标签名称不能为空' })
  @IsString({ message: '标签名称必须为字符串' })
  name: string;
}
