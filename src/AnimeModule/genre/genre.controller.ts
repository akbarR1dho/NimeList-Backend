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
  ParseIntPipe,
} from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { RolesGuard } from 'src/AuthModule/common/guards/roles.guard';
import { Roles } from 'src/AuthModule/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/AuthModule/auth/guards/jwt-auth.guard';

@Controller('genre')
export class GenreController {
  constructor(private readonly genreService: GenreService) { }

  @Post('post')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createGenreDto: CreateGenreDto) {
    return await this.genreService.createGenre(createGenreDto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return await this.genreService.deleteGenre(id);
  }

  @Get('get-all')
  async getAll() {
    return await this.genreService.getAll();
  }

  @Get('get/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getGenreById(@Param('id') id: string) {
    return await this.genreService.getById(id);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateGenreDto: CreateGenreDto,
  ) {
    return await this.genreService.updateGenre(id, updateGenreDto);
  }

  @Get('get-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllGenre(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search: string,
  ) {
    return await this.genreService.getAdmin(page, limit, search);
  }
}
