import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreatePremiumDto } from './dto/create-premium.dto';
import { UpdatePremiumDto } from './dto/update-premium.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Premium, status_premium } from './entities/premium.entity';

@Injectable()
export class PremiumService {
  constructor(
    @InjectRepository(Premium)
    private readonly premiumRepository: Repository<Premium>,
  ) {}

  async createPremium(data: CreatePremiumDto) {
    // Save data ke database
    const save = await this.premiumRepository.save(data);

    if (!save) {
      throw new BadRequestException('data not created');
    }

    return { message: 'data created' };
  }

  async findById(id: string) {
    const premium = await this.premiumRepository.findOne({ where: { id } });
    return { message: 'data fetched', data: premium };
  }

  async getPremiumAdmin(
    page: number,
    limit: number,
    search: string,
    status: string,
  ) {
    const premiumQuery = await this.premiumRepository
      .createQueryBuilder('premium')
      .leftJoin('premium.transactions', 'transactions')
      .select([
        'premium.id',
        'premium.name',
        'premium.price',
        'premium.duration',
        'premium.description',
        'premium.status',
        'transactions.id',
      ]);

    if (search) {
      premiumQuery.where('premium.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status && status !== 'all') {
      premiumQuery.andWhere('premium.status = :status', { status });
    }

    const [premium, total] = await premiumQuery
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('premium.price', 'ASC')
      .getManyAndCount();

    const result = premium.map((premium) => ({
      id: premium.id,
      name: premium.name,
      price: premium.price,
      description: premium.description,
      status: premium.status,
      duration: premium.duration,
      transactions: premium.transactions.length || 0,
    }));

    return { message: 'data fetched', data: { data: result, total } };
  }

  async getALl() {
    const data = await this.premiumRepository.find({
      where: { status: status_premium.ACTIVE },
      order: { price: 'ASC' },
    });
    return { message: 'data fetched', data };
  }

  async deletePremium(id: string) {
    const find = await this.premiumRepository.findOne({
      where: { id },
      relations: ['transactions'],
      select: {
        id: true,
        transactions: { id: true },
      },
    });

    if (find.transactions.length > 0) {
      throw new BadRequestException('transaction data exist');
    }

    const premium = await this.premiumRepository.delete(id);

    if (!premium) {
      throw new BadRequestException('data not deleted');
    }

    return { message: 'data deleted' };
  }

  async getPremiumEdit(id: string) {
    const premium = await this.premiumRepository.findOne({
      where: { id },
      select: ['id', 'name', 'price', 'duration', 'status', 'description'],
    });
    return { message: 'data fetched', data: premium };
  }

  async updatePremium(id: string, updatePremiumDto: UpdatePremiumDto) {
    const premium = await this.premiumRepository.update(id, updatePremiumDto);

    if (!premium) {
      throw new BadRequestException('data not updated');
    }

    return { message: 'data updated' };
  }
}
