import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Topic } from 'src/TopicModule/topic/entities/topic.entity';
import { Between, Repository } from 'typeorm';
import { is_premium, User } from 'src/UserModule/user/entities/user.entity';
import { Transaction } from 'src/TransactionModule/transaction/entities/transaction.entity';
import { Anime } from 'src/AnimeModule/anime/entities/anime.entity';
import { Review } from 'src/AnimeModule/review/entities/review.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Topic) private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Anime)
    private animeRepository: Repository<Anime>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async getTotalTopicThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      message: 'data fetched',
      data: {
        totalTopic:
          (await this.topicRepository.count({
            where: {
              created_at: Between(startOfMonth, endOfMonth),
            },
          })) || 0,
      },
    };
  }

  async countUserPremium() {
    const count = await this.userRepository.count({
      where: {
        status_premium: is_premium.ACTIVE,
        role: { name: 'user' },
      },
    });

    return {
      message: 'data fetched',
      data: {
        totalUserPremium: count || 0,
      },
    };
  }

  async getTop10AnimeAllTime() {
    // 1. Get global stats for all animes
    const globalStats = await this.animeRepository
      .createQueryBuilder('anime')
      .select('SUM(anime.total_reviews)', 'totalReviews')
      .addSelect(
        'SUM(anime.total_reviews * anime.avg_rating) / NULLIF(SUM(anime.total_reviews), 0)',
        'avgRatingAllAnime',
      )
      .getRawOne();

    const totalReviews = Number(globalStats?.totalReviews) || 0;
    if (totalReviews === 0) {
      return { message: 'data fetched', data: [] };
    }

    const avgRatingAllAnime = Number(globalStats?.avgRatingAllAnime) || 0;
    const minReviews = 3;

    // 2. Fetch anime stats directly from anime table (only those with >= minReviews)
    const animeStats = await this.animeRepository
      .createQueryBuilder('anime')
      .select('anime.id', 'id')
      .addSelect('anime.title', 'title')
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

    // 3. Calculate Weighted Rating in memory and sort
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
          total_reviews: v,
          avg_rating: R.toFixed(1),
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
          parseFloat(b.avg_rating) - parseFloat(a.avg_rating);
        if (avgRatingDifference !== 0) return avgRatingDifference;

        return b.latest_review_rating - a.latest_review_rating;
      })
      .slice(0, 10);

    return { message: 'data fetched', data };
  }

  // Fungsi untuk mendapatkan nama bulan berdasarkan angka
  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }

  async getReportData(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const transactions = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('EXTRACT(MONTH FROM transaction.created_at) as month')
      .addSelect(
        'SUM(CASE WHEN transaction.status = :success THEN transaction.total ELSE 0 END) as total_income',
      )
      .addSelect(
        'COUNT(CASE WHEN transaction.status = :success THEN 1 ELSE NULL END) as total_success_transactions',
      )
      .addSelect(
        'COUNT(CASE WHEN transaction.status = :failed THEN 1 ELSE NULL END) as total_failed_transactions',
      )
      .where('EXTRACT(YEAR FROM transaction.created_at) = :year', { year: targetYear })
      .setParameters({ success: 'success', failed: 'failed' })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Format hasil query ke dalam bentuk array bulanan
    const data = transactions.map((transaction) => ({
      month: this.getMonthName(transaction.month),
      income: parseFloat(transaction.total_income),
      total_success_transactions: Number(
        transaction.total_success_transactions,
      ),
      total_failed_transactions: Number(transaction.total_failed_transactions),
    }));

    return { message: 'data fetched', data };
  }

  async totalTransactionThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      message: 'data fetched',
      data: {
        total:
          (await this.transactionsRepository.count({
            where: {
              created_at: Between(startOfMonth, endOfMonth),
            },
          })) || 0,
      },
    };
  }

  async totalIncomeThisMonth() {
    const count = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.total) as total_income')
      .where(
        'EXTRACT(MONTH FROM transaction.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)',
      )
      .andWhere(
        'EXTRACT(YEAR FROM transaction.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)',
      )
      .andWhere('transaction.status = :status', { status: 'success' })
      .getRawOne();

    return {
      message: 'data fetched',
      data: {
        total: parseInt(count.total_income) || 0,
      },
    };
  }
}
