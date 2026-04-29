// src/posts/dto/apply-post.dto.ts
import { IsString, IsEmail, IsOptional, IsNumber, } from 'class-validator';

export class ApplyPostDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;


  @IsString()
  cvLink: string;
 
  @IsNumber()
  score: number;
}
