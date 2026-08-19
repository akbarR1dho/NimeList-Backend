import { Injectable } from '@nestjs/common';
import { PhotoProfile } from './entities/photo_profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';

@Injectable()
export class PhotoProfileService {
  private imageStorage = process.env.IMAGE_STORAGE;

  constructor(
    @InjectRepository(PhotoProfile)
    private photoProfileRepository: Repository<PhotoProfile>,
  ) { }

  async create(id_user: string, path: string) {
    const find = await this.photoProfileRepository.findOne({
      where: { id_user: id_user },
    });

    if (find) {
      await this.updatePhotoIfExist(id_user, path, find.path_photo);
    } else {
      const create = this.photoProfileRepository.create({
        id_user: id_user,
        path_photo: path,
      });

      await this.photoProfileRepository.save(create);
    }

    return {
      message: "photo profile uploaded successfully",
      data: path
    }
  }

  async updatePhotoIfExist(
    id_user: string,
    photoNew: string,
    photoOld?: string,
  ) {
    try {
      await unlink(`${this.imageStorage}/${photoOld}`);
      await this.photoProfileRepository.update(
        { id_user: id_user },
        {
          path_photo: photoNew,
        },
      );
    } catch (error) {
      throw new Error('Failed to update photo profile');
    }

    return {
      message: "photo profile updated successfully",
      data: photoNew
    }
  }

  async getPhoto(id: string) {
    const get = await this.photoProfileRepository.findOne({
      where: { id_user: id },
      select: ['path_photo'],
    });

    // Pastikan selalu ada prefix 'images/'
    const photoPath = `images/${get?.path_photo || 'Profile/default.jpg'}`;

    return {
      message: "photo profile fetched successfully",
      data: photoPath
    }
  }
}
