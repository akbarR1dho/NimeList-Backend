import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Param,
  Delete,
  Put,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AnimeService } from './anime.service';
import { CreateAnimeDto } from './dto/create-anime.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateAnimeDto } from './dto/update-anime.dto';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/AuthModule/common/guards/roles.guard';
import { Roles } from 'src/AuthModule/common/decorators/roles.decorator';
import {
  animeFileFields,
} from 'src/config/upload-photo-anime';

@Controller('anime')
export class AnimeController {
  constructor(private readonly animeService: AnimeService) {}

  @Post('post')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileFieldsInterceptor(animeFileFields))
  async create(
    @Body() createAnimeDto: CreateAnimeDto,
    @UploadedFiles()
    files: {
      photos_anime: Express.Multer.File[];
      photo_cover: Express.Multer.File[];
    },
  ) {
    if (!files || !files.photo_cover || files.photo_cover.length === 0) {
      throw new BadRequestException('photo_cover is required');
    }
    return await this.animeService.createAnime(
      createAnimeDto,
      files.photos_anime || [],
      files.photo_cover[0],
    );
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileFieldsInterceptor(animeFileFields))
  async updateAnimeDetails(
    @Param('id') animeId: string,
    @Body() updateAnimeDto: UpdateAnimeDto,
    @Body('genres') genres: string[],
    @Body('existing_photos') existingPhotosString: string[],
    @UploadedFiles()
    files: {
      photos_anime: Express.Multer.File[];
      photo_cover: Express.Multer.File[];
    },
  ) {
    return await this.animeService.updateAnime(
      animeId,
      updateAnimeDto,
      genres || [],
      files.photos_anime || [],
      files.photo_cover?.[0] || null,
      existingPhotosString,
    );
  }

  @Get('get-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllAnimeAdmin(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search: string,
  ) {
    return await this.animeService.getAllAnimeAdmin(page, limit, search);
  }

  @Get('get-newest')
  async getAnimeNewest(@Query('limit', ParseIntPipe) limit: number) {
    return await this.animeService.getAnimeNewest(limit);
  }

  @Get('get/:slug')
  async getAnime(@Param('slug') slug: string) {
    return await this.animeService.getAnimeBySlug(slug);
  }

  @Get('get/by-genre/:name')
  async getAnimeByGenre(@Param('name') name: string) {
    return await this.animeService.getAnimeByGenre(name);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteAnime(@Param('id') animeId: string) {
    return await this.animeService.deleteAnime(animeId);
  }

  @Get('recommended')
  async getRecommendedAnime() {
    return await this.animeService.getRecommended();
  }

  @Get('get-most-popular')
  async getMostPopular() {
    return await this.animeService.getMostPopular();
  }
}
