// src/post/post.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApplyPostDto } from './dto/apply-post.dto';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async create(
    createDto: CreatePostDto,
    creatorId: string,
    creatorRole?: string,
    companyId?: string,
  ) {
    if (!creatorId) {
      throw new BadRequestException('creatorId is required');
    }

    const created = new this.postModel({
      ...createDto,
      createdById: String(creatorId),
      createdByRole: creatorRole ?? null,
      companyId: companyId ? String(companyId) : undefined,
      score: 0,
    });

    return created.save();
  }

  async findAll(user?: { id?: string; role?: string }) {
    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) {
        throw new BadRequestException('User id missing');
      }

      return this.postModel.find({
        createdById: String(user.id),
      });
    }

    return this.postModel.find();
  }

  async findOne(id: string, user?: { id?: string; role?: string }) {
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) {
        throw new BadRequestException('User id missing');
      }

      if (post.createdById !== String(user.id)) {
        throw new ForbiddenException('Access denied');
      }
    }

    return post;
  }

  async update(
    id: string,
    dto: UpdatePostDto,
    user?: { id?: string; role?: string },
  ) {
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) {
        throw new BadRequestException('User id missing');
      }

      if (post.createdById !== String(user.id)) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que vos propres posts',
        );
      }
    }

    Object.assign(post, dto);

    return post.save();
  }

  async remove(id: string, user?: { id?: string; role?: string }) {
    const post = await this.postModel.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) {
        throw new BadRequestException('User id missing');
      }

      if (post.createdById !== String(user.id)) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que vos propres posts',
        );
      }
    }

    await this.postModel.findByIdAndDelete(id);

    return { deleted: true };
  }

  // =========================
  // APPLY WITHOUT AUTH
  // =========================
  async applyToPost(postId: string, applicantDto: ApplyPostDto) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const email = applicantDto.email.trim().toLowerCase();

    const alreadyApplied = post.applicants.some(
      (applicant) => applicant.email.trim().toLowerCase() === email,
    );

    if (alreadyApplied) {
      throw new BadRequestException(
        'Vous avez déjà postulé à cette offre avec cet email',
      );
    }

    post.applicants.push({
      ...applicantDto,
      email,
      appliedAt: new Date(),
    } as any);

    return post.save();
  }

  async removeApplicant(
    postId: string,
    applicantEmail: string,
    user?: { id?: string; role?: string },
  ) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) {
        throw new BadRequestException('User id missing');
      }

      if (post.createdById !== String(user.id)) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que vos propres posts',
        );
      }
    }

    const targetEmail = applicantEmail.trim().toLowerCase();

    post.applicants = post.applicants.filter(
      (a) => a.email.trim().toLowerCase() !== targetEmail,
    );

    return post.save();
  }
}
