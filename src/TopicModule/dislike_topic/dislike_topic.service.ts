import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDislikeTopicDto } from './dto/create-dislike_topic.dto';
import { DislikeTopic } from './entities/dislike_topic.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DislikeTopicService {
  constructor(
    @InjectRepository(DislikeTopic)
    private readonly dislikeTopicRepository: Repository<DislikeTopic>,
  ) {}

  async createDislike(data: CreateDislikeTopicDto) {
    if (!data.id_user || !data.id_topic) {
      throw new BadRequestException('user or topic not found');
    }

    const check = await this.dislikeTopicRepository.findOne({
      where: {
        id_topic: data.id_topic,
        id_user: data.id_user,
      },
    });

    if (check) {
      throw new BadRequestException('data already exist');
    }

    // Membuat data like berdasarkan data yang diterima
    const create = await this.dislikeTopicRepository.create(data);
    const saved = await this.dislikeTopicRepository.save(create);

    if (!saved) {
      throw new BadRequestException('data not created');
    }

    return {
      message: 'data created',
      data: saved,
    };
  }

  async deleteDislike(id_topic: string, id_user: string) {
    if (!id_user || !id_topic) {
      throw new BadRequestException('user or topic not found');
    }

    const deleted = await this.dislikeTopicRepository.delete({
      id_topic: id_topic,
      id_user: id_user,
    });

    if (!deleted) {
      throw new BadRequestException('data not deleted');
    }

    // Tampilkan pesan data berhasil di hapus
    return {
      message: 'data deleted',
    };
  }

  async getUserDislike(id_user: string, id_topic: string) {
    if (!id_user || !id_topic) {
      throw new NotFoundException('user or topic not found');
    }

    const find = await this.dislikeTopicRepository.find({
      where: { id_user: id_user, id_topic: id_topic },
      select: { id: true },
    });

    return { message: 'data fetched', data: find.length > 0 ? true : false };
  }
}
