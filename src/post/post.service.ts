import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import type { Express } from 'express';

import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApplyPostDto } from './dto/apply-post.dto';
import { UserRole } from 'src/user/entities/user.entity';

interface CVParsingResult {
  experience: string;
  education: string;
  years_experience: number;
  years_education: number;
  level: string;
  skills: string[];
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  // =============================
  // PARSING CV
  // =============================

  private async parseCV(filePath: string): Promise<CVParsingResult> {
    try {
      // TODO: brancher le script Python ici
      return {
        experience: '',
        education: '',
        years_experience: 0,
        years_education: 0,
        level: 'Junior',
        skills: [],
      };
    } catch (error) {
      console.error('CV Parsing error:', error);
      throw new BadRequestException('Impossible de parser le CV');
    }
  }

  // =============================
  // SCORING
  // =============================

  private calculateExperienceScore(
    yearsExp: number,
    minYears: number,
    maxYears?: number,
  ): number {
    if (minYears === 0) return 100;
    if (yearsExp < minYears) return Math.max(0, (yearsExp / minYears) * 70);
    if (maxYears && yearsExp > maxYears) return 75;
    return 100;
  }

  private calculateEducationScore(
    yearsEdu: number,
    minYearsEdu: number,
  ): number {
    if (minYearsEdu === 0) return 100;
    if (yearsEdu < minYearsEdu)
      return Math.max(0, (yearsEdu / minYearsEdu) * 60);
    return 100;
  }

  private calculateSkillsScore(
    applicantSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[],
  ): number {
    if (!requiredSkills.length) return 100;
    if (!applicantSkills.length) return 0;

    const lower = applicantSkills.map((s) => s.toLowerCase());

    const requiredMatches = requiredSkills.filter((skill) =>
      lower.some((s) => s.includes(skill.toLowerCase())),
    ).length;

    const preferredMatches = preferredSkills.filter((skill) =>
      lower.some((s) => s.includes(skill.toLowerCase())),
    ).length;

    const requiredScore = (requiredMatches / requiredSkills.length) * 100;
    const preferredBonus = preferredSkills.length
      ? (preferredMatches / preferredSkills.length) * 20
      : 0;

    return Math.min(100, requiredScore + preferredBonus);
  }

  private calculateLevelScore(
    applicantLevel: string,
    requiredLevel: string,
  ): number {
    const levels: Record<string, number> = {
      Junior: 1,
      Intermédiaire: 2,
      'Senior/Expert': 3,
    };

    const appVal = levels[applicantLevel] ?? 0;
    const reqVal = levels[requiredLevel] ?? 0;

    if (appVal >= reqVal) return 100;
    if (appVal === reqVal - 1) return 70;
    if (appVal === reqVal - 2) return 40;
    return 20;
  }

  private calculateTotalScore(
    experienceScore: number,
    educationScore: number,
    skillsScore: number,
    levelScore: number,
  ): number {
    return Math.round(
      experienceScore * 0.25 +
        educationScore * 0.15 +
        skillsScore * 0.4 +
        levelScore * 0.2,
    );
  }

  private calculateApplicantScores(
    post: PostDocument,
    cvData: CVParsingResult,
  ) {
    const experienceScore = Math.round(
      this.calculateExperienceScore(
        cvData.years_experience,
        post.minYearsExperience ?? 0,
        post.maxYearsExperience,
      ),
    );

    const educationScore = Math.round(
      this.calculateEducationScore(
        cvData.years_education,
        post.minYearsEducation ?? 0,
      ),
    );

    const skillsScore = Math.round(
      this.calculateSkillsScore(
        cvData.skills,
        post.requiredSkills ?? [],
        post.preferredSkills ?? [],
      ),
    );

    const levelScore = Math.round(
      this.calculateLevelScore(cvData.level, post.requiredLevel),
    );

    const totalScore = this.calculateTotalScore(
      experienceScore,
      educationScore,
      skillsScore,
      levelScore,
    );

    return { experienceScore, educationScore, skillsScore, levelScore, totalScore };
  }

  // ── Recalcule les stats globales du post ──
  private refreshPostStats(post: PostDocument): void {
    post.applicantsCount = post.applicants.length;

    post.matchedApplicantsCount = post.applicants.filter(
      (a) => (a.score ?? 0) >= 70,
    ).length;

    post.score =
      post.applicants.length > 0
        ? Math.round(
            post.applicants.reduce((sum, a) => sum + (a.score ?? 0), 0) /
              post.applicants.length,
          )
        : 0;
  }

  // =============================
  // CRUD POSTS
  // =============================

  async create(
    dto: CreatePostDto,
    creatorId: string,
    creatorRole?: string,
    companyId?: string,
  ) {
    if (!creatorId) throw new BadRequestException('creatorId is required');

    const post = new this.postModel({
      ...dto,
      createdById: String(creatorId),
      createdByRole: creatorRole ?? null,
      companyId: companyId ? String(companyId) : undefined,
      score: 0,
      applicants: [],
      applicantsCount: 0,
      matchedApplicantsCount: 0,
    });

    return post.save();
  }

  async findAll(user?: { id?: string; role?: string }) {
    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) throw new BadRequestException('User id missing');
      return this.postModel.find({ createdById: String(user.id) });
    }
    return this.postModel.find({ isActive: true });
  }

  async findOne(id: string, user?: { id?: string; role?: string }) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) throw new BadRequestException('User id missing');
      if (post.createdById !== String(user.id))
        throw new ForbiddenException('Access denied');
    }

    return post;
  }

  async update(
    id: string,
    dto: UpdatePostDto,
    user?: { id?: string; role?: string },
  ) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) throw new BadRequestException('User id missing');
      if (post.createdById !== String(user.id))
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres posts');
    }

    Object.assign(post, dto);
    return post.save();
  }

  async remove(id: string, user?: { id?: string; role?: string }) {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) throw new BadRequestException('User id missing');
      if (post.createdById !== String(user.id))
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres posts');
    }

    await this.postModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  // =============================
  // APPLY TO POST
  // =============================

  async applyToPost(
    postId: string,
    dto: ApplyPostDto,
    cvFile?: Express.Multer.File,
  ) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
  
    const email = dto.email.trim().toLowerCase();
  
    const alreadyApplied = post.applicants.some(
      (a) => a.email.trim().toLowerCase() === email,
    );
    if (alreadyApplied)
      throw new BadRequestException('Vous avez déjà postulé avec cet email');
  
    // Nettoyer le fichier CV si uploadé
    if (cvFile && fs.existsSync(cvFile.path)) {
      fs.unlinkSync(cvFile.path);
    }
  
    // ── Utiliser les scores envoyés par le front ──
    const newApplicant = {
      name: dto.name,
      email,
      phone: dto.phone,
      cvLink: dto.cvLink,
  
      // Données CV
      experience_text: dto.experience_text ?? '',
      education_text: dto.education_text ?? '',
      years_experience: dto.years_experience ?? 0,
      years_education: dto.years_education ?? 0,
      skills: dto.skills ?? [],
      level: dto.level ?? 'Junior',
  
      // Scores envoyés par le front ✅
      experienceScore: dto.experienceScore ?? 0,
      educationScore: dto.educationScore ?? 0,
      skillsScore: dto.skillsScore ?? 0,
      levelScore: dto.levelScore ?? 0,
      score: dto.score ?? 0,
  
      // Méta
      cvParsingStatus: dto.cvParsingStatus ?? 'pending',
      appliedAt: new Date(),
      cvParsedAt: dto.cvParsingStatus === 'success' ? new Date() : undefined,
    };
  
    post.applicants.push(newApplicant as any);
    this.refreshPostStats(post);
  
    return post.save();
  }

  // =============================
  // GET APPLICANTS WITH SCORES
  // =============================

  async getApplicantsWithScores(
    postId: string,
    user?: { id?: string; role?: string },
  ) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) throw new BadRequestException('User id missing');
      if (post.createdById !== String(user.id))
        throw new ForbiddenException('Vous ne pouvez consulter que vos propres candidatures');
    }

    const sorted = [...post.applicants].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0),
    );

    return {
      postId,
      postTitle: post.title,
      applicantsCount: post.applicantsCount,
      matchedApplicantsCount: post.matchedApplicantsCount,
      averageScore: post.score,
      applicants: sorted.map((a) => ({
        name: a.name,
        email: a.email,
        phone: a.phone,
        cvLink: a.cvLink,
        level: a.level,              // ✅ niveau du candidat
        skills: a.skills,
        years_experience: a.years_experience,
        years_education: a.years_education,
        // Scores détaillés
        experienceScore: a.experienceScore,
        educationScore: a.educationScore,
        skillsScore: a.skillsScore,
        levelScore: a.levelScore,
        score: a.score,              // score total
        appliedAt: a.appliedAt,
        cvParsingStatus: a.cvParsingStatus,
      })),
    };
  }

  // =============================
  // REMOVE APPLICANT
  // =============================

  async removeApplicant(
    postId: string,
    applicantEmail: string,
    user?: { id?: string; role?: string },
  ) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) throw new BadRequestException('User id missing');
      if (post.createdById !== String(user.id))
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres posts');
    }

    const target = applicantEmail.trim().toLowerCase();
    post.applicants = post.applicants.filter(
      (a) => a.email.trim().toLowerCase() !== target,
    );

    this.refreshPostStats(post);
    return post.save();
  }
}