import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { LikeCommentService } from './like_comment.service';
import { CreateLikeCommentDto } from './dto/create-like_comment.dto';
import { UpdateLikeCommentDto } from './dto/update-like_comment.dto';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';
import { PremiumGuard } from 'src/AuthModule/auth/guards/isPremium.guard';

@Controller('like-comment')
@UseGuards(JwtAuthGuard, PremiumGuard)
export class LikeCommentController {
  constructor(private readonly likeCommentService: LikeCommentService) {}

  @Post('post')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateLikeCommentDto, @Request() req) {
    data.id_user = req.user.userId;
    return await this.likeCommentService.createLike(data);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  async delete(@Body('id_comment') id_comment: string, @Request() req) {
    return await this.likeCommentService.deleteLike(id_comment, req.user.userId);
  }
}
