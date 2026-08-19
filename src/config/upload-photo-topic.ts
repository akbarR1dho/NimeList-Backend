import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const topicFileFields = {
  photo: [{ name: 'photos_topic', maxCount: 4 }],
  news: [{ name: 'new_photos', maxCount: 4 }],
};

export const topicUploadConfig = async (configService: ConfigService): Promise<MulterOptions> => ({
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, configService.get<string>('IMAGE_STORAGE'));
    },
    filename: (req, file, cb) => {
      cb(null, `Topic/${v4()}${extname(file.originalname)}`);
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
