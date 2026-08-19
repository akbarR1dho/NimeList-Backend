import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FavoriteAnimeService } from './favorite_anime.service';
import { CreateFavoriteAnimeDto } from './dto/create-favorite_anime.dto';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';

@Controller('favorite-anime')
export class FavoriteAnimeController {
  constructor(private readonly favoriteAnimeService: FavoriteAnimeService) { }

  @Post('post')
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() data: CreateFavoriteAnimeDto) {
    data.id_user = req.user.userId;
    return await this.favoriteAnimeService.createFav(data);
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async delete(@Request() req, @Body('id_anime') id_anime: string) {
    return await this.favoriteAnimeService.deleteFav(req.user.userId, id_anime);
  }

  @Get('user-favorites')
  @UseGuards(JwtAuthGuard)
  async userFavorites(@Request() req) {
    return this.favoriteAnimeService.userFavorites(req.user.userId);
  }

  @Get('is-favorite')
  @UseGuards(JwtAuthGuard)
  async isFavorite(@Request() req, @Query('id_anime') id_anime: string) {
    return this.favoriteAnimeService.isFavorite(req.user.userId, id_anime);
  }
}
