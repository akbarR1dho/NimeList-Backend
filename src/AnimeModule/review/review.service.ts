import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { Anime } from 'src/AnimeModule/anime/entities/anime.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    @InjectRepository(Anime) private animeRepository: Repository<Anime>,
  ) { }

  private async recalculateAnimeRating(id_anime: string) {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'total_reviews')
      .addSelect('AVG(CAST(review.rating AS DECIMAL))', 'avg_rating')
      .where('review.id_anime = :id_anime', { id_anime })
      .getRawOne();

    const total_reviews = parseInt(stats.total_reviews) || 0;
    const avg_rating = parseFloat(stats.avg_rating) || 0;

    await this.animeRepository.update(id_anime, {
      total_reviews,
      avg_rating,
    });
  }

  // Fungsi untuk membuat review
  async createReview(data: CreateReviewDto) {
    const exist = await this.reviewRepository.findOne({
      where: { id_anime: data.id_anime, id_user: data.id_user },
    });

    if (exist) {
      throw new BadRequestException('You have already reviewed this anime');
    }

    const post = await this.reviewRepository.save(data);

    if (!post) {
      throw new BadRequestException('data not created');
    }

    await this.recalculateAnimeRating(data.id_anime);

    return { message: 'data created', data: post };
  }

  // Fungsi untuk mengupdate review
  async updateReview(id: string, data: UpdateReviewDto) {
    const review = await this.reviewRepository.findOne({
      where: { id: id },
      select: ['id_user', 'id_anime'],
    });

    if (!review) {
      throw new NotFoundException('Data tidak ditemukan');
    }

    const { id_user, role, ...update } = data;

    // Cek apakah user memiliki akses untuk mengupdate data
    if (id_user !== review.id_user) {
      throw new ForbiddenException('You are not allowed to update this data');
    }

    const updateReview = await this.reviewRepository.update(id, update);

    if (!updateReview) {
      throw new BadRequestException('data not updated');
    }

    await this.recalculateAnimeRating(review.id_anime);

    return { message: 'data updated' };
  }

  // Fungsi untuk menghapus review
  async deleteReview(id: string, userId: string, role: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: id },
      select: ['id_user', 'id_anime'],
    });

    if (!review) {
      throw new NotFoundException('Data tidak ditemukan');
    }

    // Cek apakah user memiliki akses untuk menghapus data
    if (role === 'user' && review.id_user !== userId) {
      throw new ForbiddenException('you are not allowed to delete this data');
    }

    const deleted = await this.reviewRepository.delete(id);

    if (!deleted) {
      throw new BadRequestException('data not deleted');
    }

    await this.recalculateAnimeRating(review.id_anime);

    return { message: 'data deleted' };
  }

  // Fungsi untuk mendapatkan semua review untuk admin dengan pagination
  async getAllReviewAdmin(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.user', 'user') // Join table review
      .leftJoin('review.anime', 'anime') // Join table review
      .select([
        'review.id',
        'review.rating',
        'user.username',
        'anime.title',
        'review.created_at',
        'review.updated_at',
      ])
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('review.created_at', 'DESC');

    if (search) {
      query
        .where('anime.title ILIKE :search', { search: `%${search}%` })
        .orWhere('user.username ILIKE :search', { search: `%${search}%` });
    }

    const [reviews, total] = await query.getManyAndCount();

    const result = reviews.map((review) => ({
      id: review.id,
      username: review.user.username,
      title_anime: review.anime.title,
      rating: review.rating,
      created_at: review.created_at,
      updated_at: review.updated_at,
    }));

    return {
      message: 'data fetched',
      data: { data: result, total },
    };
  }

  // Fungsi untuk mendapatkan review berdasarkan id
  async getReviewById(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: id },
      relations: ['user', 'anime'],
      select: {
        id: true,
        review: true,
        rating: true,
        created_at: true,
        updated_at: true,
        user: {
          username: true,
        },
        anime: {
          title: true,
        },
      },
    });

    console.log(review);

    return {
      message: 'data fetched',
      data: {
        username: review.user.username,
        review: review.review,
        title_anime: review.anime.title,
        rating: review.rating,
        created_at: review.created_at,
        updated_at: review.updated_at,
      },
    };
  }

  // Fungsi untuk mendapatkan daftar anime yang telah diulas oleh user
  async getAnimeReviewed(id_user: string) {
    const anime = await this.reviewRepository.find({
      where: { id_user: id_user },
      relations: ['anime'],
      select: {
        anime: {
          id: true,
        },
      },
    });

    return { message: 'data fetched', data: anime.map((anime) => anime.anime.id) };
  }

  async getReviewByAnime(id_anime: string, page: number, limit: number) {
    const get = await this.reviewRepository.find({
      where: { id_anime: id_anime },
      relations: ['user', 'user.photo_profile'],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        review: true,
        user: {
          username: true,
          name: true,
          id: true,
          status_premium: true,
          photo_profile: {
            path_photo: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
      order: { created_at: 'DESC' },
    });

    const total = await this.reviewRepository.count({
      where: { id_anime: id_anime },
    });

    const result = get.map((review) => {
      const userPhotoRecord = review.user.photo_profile && review.user.photo_profile.length > 0
        ? review.user.photo_profile[0].path_photo
        : 'Profile/default.jpg';
      const user_photo = `images/${userPhotoRecord}`;

      return {
        id: review.id,
        username: review.user.username,
        name: review.user.name,
        status_premium: review.user.status_premium,
        rating: parseFloat(review.rating.toString()),
        review: review.review,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user_photo,
      };
    });

    return {
      message: 'data fetched',
      data: { data: result, total },
    };
  }

  // Fungsi untuk mendapatkan rata-rata rating berdasarkan id anime
  async getAvgRatingByAnime(id: string) {
    const review = await this.reviewRepository.average('rating', {
      id_anime: id,
    });

    if (!review) return { message: 'data fetched', data: 0 };

    return { message: 'data fetched', data: Number(parseFloat(review.toString()).toFixed(1)) };
  }

  // Fungsi untuk mendapatkan daftar review berdasarkan id anime
  async getAndCountByAnime(id: string) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { id_anime: id },
      relations: ['user'],
      select: {
        id: true,
        rating: true,
        review: true,
        user: {
          username: true,
          name: true,
          status_premium: true,
        },
        created_at: true,
        updated_at: true,
      },
      order: { created_at: 'DESC' },
    });

    return {
      message: 'data fetched',
      data: {
        data: reviews.map((review) => ({
          id: review.id,
          username: review.user.username,
          name: review.user.name,
          review: review.review,
          rating: parseFloat(review.rating.toString()),
          status_premium: review.user.status_premium,
          created_at: review.created_at,
          updated_at: review.updated_at,
        })),
        total,
      },
    };
  }

  // Fungsi untuk mendapatkan rating berdasarkan id user
  async getUserRating(id_user: string, id_anime: string) {
    const rating = await this.reviewRepository.findOne({
      where: { id_user: id_user, id_anime: id_anime },
      select: ['rating'],
    });

    if (!rating) return { message: 'data fetched', data: 0 };

    return { message: 'data fetched', data: Number(rating.rating) };
  }
}
