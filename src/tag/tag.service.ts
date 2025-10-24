import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagEntity } from '../entities/tag.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  // 创建标签
  async create(CreateTagDto: CreateTagDto, userId: number) {
    const { name } = CreateTagDto;
    // 自定义随机颜色
    const color = this.randomHexColor();
    const tag = await this.tagRepository.save({ name, userId, color });
    if (!tag) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '创建标签失败');
    }
    return {
      value: tag.id,
      label: name,
      color,
    };
  }

  // 删除标签
  async delete(tagId: number) {
    const tag = await this.tagRepository.delete(tagId);
    if (!tag) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '删除标签失败');
    }
    return;
  }

  // 更新标签
  async update(tagId: number, updateTagDto: UpdateTagDto) {
    const { name } = updateTagDto;
    const tag = await this.tagRepository.update(tagId, { name });
    if (!tag) {
      throw new CustomException(ErrorCode.INTERNAL_ERROR, '更新标签失败');
    }
    return;
  }

  // 获取列表
  async getList(userId: number) {
    const tags = await this.tagRepository.find({ where: { userId } });
    return tags;
  }

  // 随机 #RRGGBB
  randomHexColor(): string {
    const n = Math.floor(Math.random() * 0xffffff); // 0 ~ 16777215
    return `#${n.toString(16).padStart(6, '0')}`;
  }
}
