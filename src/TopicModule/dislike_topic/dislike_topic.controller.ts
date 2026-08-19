import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DislikeTopicService } from './dislike_topic.service';
import { CreateDislikeTopicDto } from './dto/create-dislike_topic.dto';
import { PremiumGuard } from 'src/AuthModule/auth/guards/isPremium.guard';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';

@Controller('dislike-topic')
@UseGuards(JwtAuthGuard, PremiumGuard)
export class DislikeTopicController {
  constructor(private readonly dislikeTopicService: DislikeTopicService) {}

  @Post('post')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateDislikeTopicDto, @Request() req) {
    data.id_user = req.user.userId;
    return await this.dislikeTopicService.createDislike(data);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Body('id_topic') id_topic: string, @Request() req) {
    return await this.dislikeTopicService.deleteDislike(
      id_topic,
      req.user.userId,
    );
  }

  @Get('get-user-dislike')
  @HttpCode(HttpStatus.OK)
  async getUserLikes(@Request() req, @Query('id_topic') id_topic: string) {
    return await this.dislikeTopicService.getUserDislike(req.user.userId, id_topic);
  }
}
