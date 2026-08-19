import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PhotoProfileService } from './photo_profile.service';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';

@Controller('photo-profile')
export class PhotoProfileController {
  constructor(private readonly photoProfileService: PhotoProfileService) { }

  @Get('get')
  @UseGuards(JwtAuthGuard)
  async getPhoto(@Request() req) {
    return await this.photoProfileService.getPhoto(req.user.userId);
  }
}
