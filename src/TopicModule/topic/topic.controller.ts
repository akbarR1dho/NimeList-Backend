import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Put,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as sanitize from 'sanitize-html';
import { Roles } from 'src/AuthModule/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/AuthModule/common/guards/roles.guard';
import { PremiumGuard } from 'src/AuthModule/auth/guards/isPremium.guard';
import { UpdateTopicDto } from './dto/update-topic.dto';
import {
  topicFileFields,
} from 'src/config/upload-photo-topic';

@Controller('topic')
@UseGuards(PremiumGuard, JwtAuthGuard)
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post('post')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('user')
  @UseInterceptors(FileFieldsInterceptor(topicFileFields.photo))
  async create(
    @Body() createTopicDto: CreateTopicDto,
    @UploadedFiles() files: { photos_topic: Express.Multer.File[] },
    @Request() req,
  ) {
    createTopicDto.id_user = req.user.userId;
    createTopicDto.body = this.filterHtmlContent(createTopicDto.body);

    return this.topicService.createTopic(createTopicDto, files.photos_topic);
  }

  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor(topicFileFields.news))
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTopicDto: UpdateTopicDto,
    @UploadedFiles() files: { new_photos: Express.Multer.File[] },
  ) {
    console.log(files);
    updateTopicDto.body = this.filterHtmlContent(updateTopicDto.body);
    updateTopicDto.photos = files.new_photos || [];
    updateTopicDto.id_user = req.user.userId;
    updateTopicDto.role = req.user.role;

    return await this.topicService.update(id, updateTopicDto);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Request() req) {
    return await this.topicService.deleteTopic(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Get('get-all')
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return await this.topicService.getAll();
  }

  @Get('get-topics-popular')
  @HttpCode(HttpStatus.OK)
  async getTopicsPopular() {
    return await this.topicService.getTopicsPopular();
  }

  @Get('get/:slug')
  @HttpCode(HttpStatus.OK)
  async getTopicById(@Param('slug') slug: string) {
    return await this.topicService.getTopicBySlug(slug);
  }

  @Get('get-admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllTopic(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return await this.topicService.getAllTopicAdmin(page, limit, search);
  }

  // Fungsi untuk memfilter dan sanitasi HTML content
  private filterHtmlContent(html: string): string {
    const allowedTags = [
      'p',
      'b',
      'i',
      'strong',
      'em',
      'h1',
      'h2',
      'h3',
      'a',
      'ul',
      'li',
      'ol',
      'blockquote',
    ];
    return sanitize(html, {
      allowedTags,
      allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'alt', 'title', 'width', 'height'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
  }
}
