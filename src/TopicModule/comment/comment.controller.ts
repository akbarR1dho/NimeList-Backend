import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';
import { PremiumGuard } from 'src/AuthModule/auth/guards/isPremium.guard';
import { Role } from 'src/UserModule/role/entities/role.entity';
import { RolesGuard } from 'src/AuthModule/common/guards/roles.guard';
import { Roles } from 'src/AuthModule/common/decorators/roles.decorator';

@Controller('comment')
@UseGuards(JwtAuthGuard, PremiumGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('post')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateCommentDto, @Request() req) {
    data.id_user = req.user.userId;
    return await this.commentService.createComment(data);
  }

  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCommentDto,
    @Request() req,
  ) {
    data.id_user = req.user.userId;
    data.role = req.user.role;
    return await this.commentService.updateComment(id, data);
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Request() req) {
    return await this.commentService.deleteComment(id, req.user);
  }

  @Get('get-admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllComment(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return await this.commentService.getAllCommentAdmin(page, limit, search);
  }

  @Get('get/:id')
  @HttpCode(HttpStatus.OK)
  async getCommentById(@Param('id') id: string) {
    return await this.commentService.getCommentById(id);
  }

  @Get('get/by-topic/:id')
  @HttpCode(HttpStatus.OK)
  async getCommentByTopic(
    @Param('id') id: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 5,
    @Request() req,
  ) {
    return await this.commentService.getCommentByTopic(id, page, limit, req.user.userId);
  }
}
