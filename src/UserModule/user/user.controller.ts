import {
  Controller,
  Get,
  Body,
  UseGuards,
  Param,
  Query,
  Put,
  UploadedFiles,
  UseInterceptors,
  Request,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../AuthModule/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../AuthModule/common/guards/roles.guard';
import { Roles } from '../../AuthModule/common/decorators/roles.decorator';
import { is_premium } from './entities/user.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  profileFileFields,
} from 'src/config/upload-photo-profile';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('get-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllUsers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('status') status?: is_premium,
  ) {
    return await this.userService.getUsers(page, limit, search, status);
  }

  @Put('refresh-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser() {
    return await this.userService.refreshUsers();
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string) {
    return await this.userService.getProfile(username);
  }

  @Put('update-profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor(profileFileFields))
  async updateProfile(
    @Request() req,
    @Body() body: UpdateUserDto,
    @UploadedFiles()
    files: {
      photo_profile?: Express.Multer.File[];
    },
  ) {
    return await this.userService.updateProfile(
      req.user.userId,
      body,
      files.photo_profile?.[0] || null,
    );
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Request() req, @Body('password') password: string) {
    return await this.userService.deleteUser(req.user.userId, password);
  }

  @Get('check-premium')
  @UseGuards(JwtAuthGuard)
  async getCheckPremium(@Request() req) {
    return await this.userService.checkPremium(req.user.userId);
  }

  @Get('detail/:username')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getDetailUser(@Param('username') username: string) {
    return await this.userService.getUserDetail(username);
  }
}
