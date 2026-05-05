// src/post/post.controller.ts
import {
  Controller,
  Get,
  Post as HttpPost,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';

import { PostsService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApplyPostDto } from './dto/apply-post.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

interface RequestWithUser extends Request {
  user?: { id?: string; role?: string; companyId?: string };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.postsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @HttpPost()
  create(@Body() dto: CreatePostDto, @Req() req: RequestWithUser) {
    if (!req.user?.id) throw new UnauthorizedException('Utilisateur non authentifié');
    return this.postsService.create(dto, req.user.id, req.user.role, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.update(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.remove(id, req.user);
  }

  // ── Candidature publique avec upload CV ──
  @HttpPost(':id/apply')
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: diskStorage({
        destination: './uploads/cvs',
        filename: (_, file, cb) =>
          cb(null, `${Date.now()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (_, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx'];
        const ext = extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
      },
    }),
  )
  async apply(
    @Param('id') id: string,
    @Body() dto: ApplyPostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.applyToPost(id, dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Get(':id/applicants')
  getApplicants(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.getApplicantsWithScores(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Delete(':id/applicants/:email')
  removeApplicant(
    @Param('id') id: string,
    @Param('email') email: string,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.removeApplicant(id, email, req.user);
  }
}