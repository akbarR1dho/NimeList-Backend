import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { CreateLikeCommentDto } from './dto/create-like_comment.dto';
import { UpdateLikeCommentDto } from './dto/update-like_comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LikeComment } from './entities/like_comment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LikeCommentService {
  constructor(
    @InjectRepository(LikeComment)
    private likeCommentRepository: Repository<LikeComment>,
  ) {}

  async createLike(data: CreateLikeCommentDto) {
    const search = await this.likeCommentRepository.findOne({
      where: {
        id_comment: data.id_comment,
        id_user: data.id_user,
      }
    });

    if (search) {
      throw new BadRequestException('data already exist');
    }

    const saved = await this.likeCommentRepository.save(data);

    if (!saved) {
      throw new BadRequestException('data not created');
    }

    // Tampilkan pesan data berhasil dibuat
    return { message: 'data created', data: saved };
  }

  async deleteLike(id_comment: string, id_user: string) {
    // Hapus data like berdasarkan id
    const deleted = await this.likeCommentRepository.delete({
      id_comment: id_comment,
      id_user: id_user,
    });

    if (!deleted) {
      throw new BadRequestException('data not deleted');
    }

    return { message: 'data deleted', data: deleted };
  }
}
