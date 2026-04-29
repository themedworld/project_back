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
} from '@nestjs/common';

import { Request } from 'express';

import { PostsService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApplyPostDto } from './dto/apply-post.dto';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    role?: string;
    companyId?: string;
  };
}

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
  ) {}

  // =========================
  // ONLY HR CAN CONSULT POSTS
  // Each HR sees only his posts
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.postsService.findAll(req.user);
  }


  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.findOne(id, req.user);
  }

  // =========================
  // CREATE POST (HR ONLY)
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @HttpPost()
  create(
    @Body() dto: CreatePostDto,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;

    if (!user?.id) {
      throw new UnauthorizedException(
        'Utilisateur non authentifié',
      );
    }

    return this.postsService.create(
      dto,
      user.id,
      user.role,
      user.companyId,
    );
  }

  // =========================
  // UPDATE POST (OWNER HR)
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.update(
      id,
      dto,
      req.user,
    );
  }

  // =========================
  // DELETE POST (OWNER HR)
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.remove(
      id,
      req.user,
    );
  }

  // =========================
  // PUBLIC APPLY (NO AUTH)
  // =========================

  @HttpPost(':id/apply')
  apply(
    @Param('id') id: string,
    @Body() dto: ApplyPostDto,
  ) {
    return this.postsService.applyToPost(id, dto);
  }

  // =========================
  // REMOVE APPLICANT (OWNER HR)
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HR_MANAGER)
  @Delete(':id/applicants/:email')
  removeApplicant(
    @Param('id') id: string,
    @Param('email') email: string,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.removeApplicant(
      id,
      email,
      req.user,
    );
  }
}
