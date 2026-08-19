import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const animeUploadConfig = async (configService: ConfigService): Promise<MulterOptions> => ({
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, configService.get<string>('IMAGE_STORAGE'));
    },
    filename: (req, file, cb) => {
      const pathCustom =
        file.fieldname === 'photo_cover' ? 'Anime/Cover' : 'Anime/Content';
      cb(null, `${pathCustom}/${uuidv4()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      !file.originalname.match(/\.(jpg|jpeg|png)$/i) ||
      !file.mimetype.match(/\/+(jpg|jpeg|png)$/i)
    ) {
      return cb(
        new BadRequestException('Only image files are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

export const animeFileFields = [
  { name: 'photos_anime', maxCount: 4 },
  { name: 'photo_cover', maxCount: 1 },
];
