import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Anime } from './entities/anime.entity';
import { Genre } from 'src/AnimeModule/genre/entities/genre.entity';
import { PhotoAnime } from 'src/AnimeModule/photo_anime/entities/photo_anime.entity';
import { CreateAnimeDto } from './dto/create-anime.dto';
import { In } from 'typeorm';
import { unlink } from 'fs/promises';
import { FavoriteAnime } from 'src/AnimeModule/favorite_anime/entities/favorite_anime.entity';
import { UpdateAnimeDto } from './dto/update-anime.dto';
import { ReviewService } from '../review/review.service';
import { TopicService } from 'src/TopicModule/topic/topic.service';
import { GenreService } from '../genre/genre.service';
import slugify from 'slugify';
import { Review } from 'src/AnimeModule/review/entities/review.entity';

@Injectable()
export class AnimeService {
  private imageStorage = process.env.IMAGE_STORAGE;

  constructor(
    @InjectRepository(Anime)
    private animeRepository: Repository<Anime>,
    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
    @InjectRepository(PhotoAnime)
    private photoRepository: Repository<PhotoAnime>,
    @InjectRepository(FavoriteAnime)
    private favoriteAnimeRepository: Repository<FavoriteAnime>,
    private readonly reviewService: ReviewService,
    private readonly topicService: TopicService,
    private readonly genreService: GenreService,
  ) { }

  async createAnime(
    createAnimeDto: CreateAnimeDto,
    files: Express.Multer.File[],
    photo_cover: Express.Multer.File,
  ) {
    const { title, genres } = createAnimeDto;

    // Cari genre berdasarkan ID
    const genreEntities = await this.genreRepository.find({
      where: {
        id: In(Array.isArray(genres) ? genres : [genres]),
      },
    });

    const anime = this.animeRepository.create({
      ...createAnimeDto,
      photo_cover: photo_cover.filename,
      genres: genreEntities,
      slug: slugify(title, { lower: true, strict: true }),
    });

    let save;
    try {
      save = await this.animeRepository.save(anime);
    } catch (error) {
      if (files && files.length > 0) {
        for (const file of files) {
          try { await unlink(file.path); } catch (e) { }
        }
      }
      if (photo_cover) {
        try { await unlink(photo_cover.path); } catch (e) { }
      }
      throw new BadRequestException('data not created: ' + error.message);
    }

    // Simpan photo jika ada dan save data anime berhasil
    if (save && files && files.length > 0) {
      for (const file of files) {
        const photo = this.photoRepository.create({
          file_path: file.filename,
          anime,
        });
        await this.photoRepository.save(photo);
      }
    }

    return { message: 'data created', data: anime };
  }

  // Fungsi untuk Mengupdate Anime
  async updateAnime(
    animeId: string,
    updateAnimeDto: UpdateAnimeDto,
    genres: string[],
    photo_anime: Express.Multer.File[],
    photo_cover: Express.Multer.File,
    existing_photos: string[],
  ) {
    // Cari anime berdasarkan ID
    const anime = await this.animeRepository.findOne({
      where: { id: animeId },
      relations: ['genres', 'photos'],
    });

    if (!anime) {
      throw new NotFoundException('Anime tidak ditemukan');
    }

    if (anime.title !== updateAnimeDto.title) {
      updateAnimeDto.slug = slugify(updateAnimeDto.title, {
        lower: true,
        strict: true,
      });
    }

    // Update informasi dasar anime
    Object.assign(anime, updateAnimeDto);

    if (photo_cover) {
      // unlink(`${imageStorage}/${anime.photo_cover}`);
      anime.photo_cover = photo_cover.filename;
    }

    // Jika ada genre yang diberikan
    if (genres.length > 0) {
      const genreEntities = await this.genreRepository.find({
        where: {
          id: In(Array.isArray(genres) ? genres : [genres]),
        },
      });

      if (genreEntities.length === 0) {
        throw new BadRequestException('Genre tidak ditemukan');
      }

      anime.genres = genreEntities;
    }

    // Save anime
    const save = await this.animeRepository.save(anime);

    if (!save) {
      throw new BadRequestException('data not updated');
    }

    // Hapus data foto lama
    for (const photo of anime.photos) {
      // Cek apakah existing_photos memberikan path yang tidak ada di dalam sistem
      if (!existing_photos.includes('images/' + photo.file_path)) {
        try {
          await unlink(`${this.imageStorage}/${photo.file_path}`);
        } catch (err) {
          console.error('Error hapus data file foto anime:', err);
        }

        // Hapus foto dari database
        await this.photoRepository.delete(photo.id);
      }
    }

    if (photo_anime && photo_anime.length > 0) {
      // Simpan path dan file foto baru yang belum ada di database
      photo_anime
        .filter((file) => !existing_photos.includes('images/' + file.filename)) // Hanya simpan file dan path baru yang belum ada di database
        .map(async (file) => {
          const photo = this.photoRepository.create({
            file_path: file.filename,
            id_anime: anime.id,
          });
          await this.photoRepository.save(photo);
        });
    }

    return { message: 'data updated', data: anime };
  }

  // Fungsi untuk Mendapatkan Anime berdasarkan slug
  async getAnimeBySlug(slug: string) {
    // Cari anime berdasarkan id
    const anime = await this.animeRepository.findOne({
      where: { slug: slug },
      relations: ['photos'],
    });

    // Konfigurasi path gambar
    anime.photos = anime.photos.map(
      (photo) => 'images/' + photo.file_path,
    ) as [];
    anime.photo_cover = 'images/' + anime.photo_cover;

    if (!anime) {
      throw new NotFoundException('Anime tidak ditemukan');
    }

    // Hitung average rating dari id anime
    const getAvgRating = await this.reviewService.getAvgRatingByAnime(anime.id);

    // Ambil jumlah dan data topic yang berkaitan dengan id anime
    const topic = await this.topicService.getAndCountByAnime(anime.id);

    // Ambil semua data genre yang berkaitan dengan id anime
    const genres = await this.genreService.getByAnime(anime.id);

    // Hitung jumlah favorit berdasarkan id anime
    const totalFav = await this.favoriteAnimeRepository.countBy({
      id_anime: anime.id,
    });

    return {
      message: 'data fetched',
      data: { anime, genres, avgRating: getAvgRating, topic, totalFav },
    };
  }

  // Fungsi untuk Menghapus Anime
  async deleteAnime(animeId: string) {
    // Hapus anime dari database berdasarkan id yang diberikan
    const deleted = await this.animeRepository.softDelete({ id: animeId });
    const photoDeleted = await this.photoRepository.softDelete({
      id_anime: animeId,
    });

    // Tampilkan pesan jika data berhasil dihapus
    if (!deleted && !photoDeleted) {
      throw new BadRequestException('data not deleted');
    }

    return { message: 'data deleted', data: { deleted, photoDeleted } };
  }

  // Fungsi untuk Mendapatkan semua Anime untuk admin dengan pagination
  async getAllAnimeAdmin(
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ) {
    // Ambil semua data anime
    const [animes, total] = await this.animeRepository.findAndCount({
      where: {
        title: ILike(`%${search}%`),
      },
      order: {
        release_date: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = animes.map((anime) => {
      return {
        id: anime.id,
        title: anime.title,
        created_at: anime.created_at,
        release_date: anime.release_date,
        updated_at: anime.updated_at,
        slug: anime.slug,
        avg_rating: Number(anime.avg_rating),
      };
    });

    return {
      message: 'data fetched',
      data: { data, total, animes }
    };
  }

  // Fungsi untuk Mendapatkan Anime Terbaru
  async getAnimeNewest(limit: number) {
    const animes = await this.animeRepository
      .createQueryBuilder('anime')
      .leftJoin('anime.photos', 'photo')
      .leftJoin('anime.genres', 'genre') // Join table genre
      .addSelect('array_agg(distinct genre.name)', 'genres') // Aggregate genre names as an array
      .addSelect('array_agg(DISTINCT photo.file_path)', 'photos')
      .groupBy('anime.id')
      .orderBy('anime.release_date', 'DESC')
      .limit(limit)
      .getRawMany();

    const result = animes.map((anime) => ({
      id: anime.anime_id,
      synopsis: anime.anime_synopsis,
      title: anime.anime_title,
      photo_cover: 'images/' + anime.anime_photo_cover,
      trailer_link: anime.anime_trailer_link,
      type: anime.anime_type,
      slug: anime.anime_slug,
      avgRating: parseFloat(anime.anime_avg_rating).toFixed(1),
      genres: anime.genres,
      backdrop: 'images/' + anime.photos[0] || null,
    }));

    return { message: 'data fetched', data: result };
  }

  // Fungsi untuk Mendapatkan Anime Berdasarkan Genre
  async getAnimeByGenre(name: string) {
    const animes = await this.animeRepository
      .createQueryBuilder('anime')
      .leftJoin('anime.genres', 'genre') // Join table genre
      .select([
        'anime.id',
        'anime.photo_cover',
        'anime.type',
        'anime.title',
        'anime.slug',
        'anime.avg_rating',
      ])
      .where('genre.name = :name', { name }) // Menyaring anime berdasarkan nama genre
      .groupBy('anime.id')
      .getRawMany();

    // Jika tidak ada anime yang mengandung genre yang dipilih
    if (animes.length === 0) {
      throw new NotFoundException(
        'Anime yang mengandung genre ini tidak ditemukan',
      );
    }

    // Tampilkan anime yang ada
    const result = animes.map((anime) => ({
      id: anime.anime_id,
      photo_cover: 'images/' + anime.anime_photo_cover,
      type: anime.anime_type,
      title: anime.anime_title,
      slug: anime.anime_slug,
      avgRating: parseFloat(anime.anime_avg_rating).toFixed(1),
    }));

    return { message: 'data fetched', data: result };
  }

  // Fungsi untuk Mendapatkan Anime Rekomendasi
  async getRecommended() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();

    // Tentukan periode berdasarkan bulan saat ini
    let startDate: Date;
    let endDate: Date;

    if (currentDate.getMonth() < 6) {
      // Periode Januari - Juni
      startDate = new Date(year, 0, 1); // 1 Januari
      endDate = new Date(year, 5, 30, 23, 59, 59); // 30 Juni
    } else {
      // Periode Juli - Desember
      startDate = new Date(year, 6, 1); // 1 Juli
      endDate = new Date(year, 11, 31, 23, 59, 59); // 31 Desember
    }

    const recommendedAnimes = await this.animeRepository
      .createQueryBuilder('anime')
      .leftJoin('anime.review', 'review')
      .select([
        'anime.id',
        'anime.title',
        'anime.photo_cover',
        'anime.type',
        'anime.slug',
        'AVG(review.rating) AS avg_rating',
        'COUNT(review.id) AS review_count',
      ])
      .groupBy('anime.id')
      .where('review.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('avg_rating', 'DESC') // Urutkan berdasarkan rating
      .limit(14) // Batasi ke 14 anime teratas
      .getRawMany();

    return recommendedAnimes.map((anime) => ({
      message: 'data fetched',
      data: {
        id: anime.anime_id,
        title: anime.anime_title,
        photo_cover: 'images/' + anime.anime_photo_cover,
        type: anime.anime_type,
        slug: anime.anime_slug,
        avgRating: parseFloat(anime.avg_rating).toFixed(1),
      },
    }));
  }

  // Fungsi untuk Mendapatkan Anime Populer dengan sistem weighted rating
  async getMostPopular() {
    const globalStats = await this.animeRepository
      .createQueryBuilder('anime')
      .select('SUM(anime.total_reviews)', 'totalReviews')
      .addSelect(
        'SUM(anime.total_reviews * anime.avg_rating) / NULLIF(SUM(anime.total_reviews), 0)',
        'avgRatingAllAnime',
      )
      .getRawOne();

    const totalReviewsGlobal = Number(globalStats?.totalReviews) || 0;
    if (totalReviewsGlobal === 0) {
      return { message: 'data fetched', data: [] };
    }

    const avgRatingAllAnime = Number(globalStats?.avgRatingAllAnime) || 0;
    const minReviews = 3;

    const animeStats = await this.animeRepository
      .createQueryBuilder('anime')
      .select('anime.id', 'id')
      .addSelect('anime.title', 'title')
      .addSelect('anime.photo_cover', 'photo_cover')
      .addSelect('anime.type', 'type')
      .addSelect('anime.slug', 'slug')
      .addSelect('anime.total_reviews', 'total_reviews')
      .addSelect('anime.avg_rating', 'avg_rating')
      .addSelect((subQuery) => {
        return subQuery
          .select('r.rating')
          .from(Review, 'r')
          .where('r.id_anime = anime.id')
          .orderBy('r.created_at', 'DESC')
          .limit(1);
      }, 'latest_review_rating')
      .where('anime.total_reviews >= :minReviews', { minReviews })
      .getRawMany();

    const data = animeStats
      .map((anime) => {
        const v = Number(anime.total_reviews);
        const R = Number(anime.avg_rating);
        const latestRating = Number(anime.latest_review_rating) || 0;

        const weightedRating =
          (v / (v + minReviews)) * R +
          (minReviews / (v + minReviews)) * avgRatingAllAnime;

        return {
          title: anime.title,
          id: anime.id,
          photo_cover: 'images/' + anime.photo_cover,
          type: anime.type,
          slug: anime.slug,
          total_reviews: v,
          avgRating: R.toFixed(1),
          weighted_rating: weightedRating.toFixed(1),
          latest_review_rating: latestRating,
        };
      })
      .sort((a, b) => {
        const weightedDifference =
          parseFloat(b.weighted_rating) - parseFloat(a.weighted_rating);
        if (weightedDifference !== 0) return weightedDifference;

        const reviewDifference = b.total_reviews - a.total_reviews;
        if (reviewDifference !== 0) return reviewDifference;

        const avgRatingDifference =
          parseFloat(b.avgRating) - parseFloat(a.avgRating);
        if (avgRatingDifference !== 0) return avgRatingDifference;

        return b.latest_review_rating - a.latest_review_rating;
      })
      .slice(0, 10);

    // Tampilkan hasil query
    return {
      message: 'data fetched',
      data: data,
    };
  }
}
