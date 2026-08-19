import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Genre } from 'src/AnimeModule/genre/entities/genre.entity';
import { PhotoAnime } from 'src/AnimeModule/photo_anime/entities/photo_anime.entity';
import { Topic } from 'src/TopicModule/topic/entities/topic.entity';
import { FavoriteAnime } from 'src/AnimeModule/favorite_anime/entities/favorite_anime.entity';
import { Review } from 'src/AnimeModule/review/entities/review.entity';

export enum Types {
  MOVIE = 'movie',
  SERIES = 'series',
}

@Entity()
export class Anime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true })
  title: string;

  @Column('varchar', { length: 255, unique: true })
  slug: string;

  @Column('text')
  synopsis: string;

  @Column('varchar', { length: 10 })
  release_date: string;

  @Column('integer')
  episodes: number;

  @Column('text')
  photo_cover: string;

  @Column('text')
  trailer_link: string;

  @Column('text')
  watch_link: string;

  @Column('enum', { enum: Types })
  type: Types;

  @Column('decimal', { precision: 3, scale: 1, default: 0 })
  avg_rating: number;

  @Column('integer', { default: 0 })
  total_reviews: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => Genre, (genre) => genre.animes, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'anime_genre' })
  genres: Genre[];

  @OneToMany(() => PhotoAnime, (photo) => photo.anime)
  photos: PhotoAnime[];

  @OneToMany(() => Review, (review) => review.anime)
  review: Review[];

  @OneToMany(() => Topic, (topic) => topic.anime)
  topic: Topic;

  @OneToMany(() => FavoriteAnime, (favorite) => favorite.anime)
  favorite: FavoriteAnime[];
}
