import { IsNotEmpty, IsString, IsNumber, Min, Max } from "class-validator";

export class CreateReviewDto {
    @IsNotEmpty()
    @IsString()
    id_anime: string;

    @IsNotEmpty()
    @IsString()
    id_user: string;

    @IsNotEmpty()
    @IsString()
    review: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(10)
    rating: number;
}
