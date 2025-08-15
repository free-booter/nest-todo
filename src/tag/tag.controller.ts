import { Controller, Post, Body, UseGuards, Req, Delete, Param, Put, Get } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequest } from 'src/user/interfaces/user.interface';
import { UpdateTagDto } from './dto/update-tag.dto';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post('create')
  @ApiOperation({ summary: '创建标签' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTagDto: CreateTagDto, @Req() req: UserRequest) {
    return this.tagService.create(createTagDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: number) {
    return this.tagService.delete(id);
  }

  @Put('update')
  @ApiOperation({ summary: '更新标签' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Body() updateTagDto: UpdateTagDto & { id: number }) {
    return this.tagService.update(updateTagDto.id, updateTagDto);
  }

  @Get('list')
  @ApiOperation({ summary: '获取标签列表' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getList(@Req() req: UserRequest) {
    return this.tagService.getList(req.user.id);
  }
}
