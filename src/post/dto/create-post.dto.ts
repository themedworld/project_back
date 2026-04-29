// src/posts/dto/create-post.dto.ts
import { IsString, IsOptional, IsArray, ArrayUnique, IsBoolean } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
