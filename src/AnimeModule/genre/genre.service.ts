import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre) private genreRepository: Repository<Genre>,
  ) {}

  // Fungsi untuk membuat data genre
  async createGenre(data: CreateGenreDto) {
    const addGenre = await this.genreRepository.create(data);
    const saved = await this.genreRepository.save(addGenre);

    if(!saved) {
      throw new BadRequestException('data not created');
    }

    return {
      message: 'data created',
      data: saved,
    };
  }

  // Fungsi untuk menghapus data genre berdasarkan id
  async deleteGenre(id: string) {
    // Hapus data genre berdasarkan id yang diberikan
    const deleted = await this.genreRepository.delete(id);

    if (!deleted) {
      throw new BadRequestException('data not deleted');
    }

    return { message: 'data deleted' };
  }

  // Fungsi untuk mengupdate data genre
  async updateGenre(id: string, updateGenreDto: CreateGenreDto) {
    // Update data genre berdasarkan id yang diberikan
    const updated = await this.genreRepository.update(id, updateGenreDto);

    if (!updated) {
      throw new BadRequestException('data not updated');
    }

    return { message: 'data updated' };
  }

  // Fungsi untuk mendapatkan data genre berdasarkan id
  async getById(id: string) {
    const get = await this.genreRepository.findOne({ where: { id } });
    if (!get) {
      throw new NotFoundException('data not found');
    }
    return { message: 'data fetched', data: get };
  }

  // Fungsi untuk mendapatkan semua data genre
  async getAll() {
    const data = await this.genreRepository.find();
    return { message: 'data fetched', data };
  }

  // Fungsi untuk mendapatkan semua data genre untuk admin
  async getAdmin(page: number = 1, limit: number = 10, search: string = '') {
    const [data, total] = await this.genreRepository.findAndCount({
      where: { name: ILike(`%${search}%`) },
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      message: 'data fetched',
      data: { data, total },
    };
  }

  // Fungsi untuk mendapatkan data genre berdasarkan id anime
  async getByAnime(id: string) {
    const get = await this.genreRepository.find({
      where: { animes: { id } },
      select: ['id', 'name'],
    });

    if (!get) {
      throw new NotFoundException('data not found');
    }

    return { message: 'data fetched', data: get };
  }
}
