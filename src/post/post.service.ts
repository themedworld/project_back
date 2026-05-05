// src/post/post.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

import { Post, PostDocument, Applicant } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApplyPostDto } from './dto/apply-post.dto';
import { UserRole } from 'src/user/entities/user.entity';

// Interface pour le résultat du parsing CV
interface CVParsingResult {
  experience: string;
  education: string;
  years_experience: number;
  years_education: number;
  level: string;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  // =============================
  // PARSING CV (LOCAL)
  // =============================
  private async parseCV(filePath: string): Promise<CVParsingResult> {
    try {
      // TODO : Intégrer ton script Python de parsing CV
      // Pour maintenant, retourner des données par défaut
      return {
        experience: '',
        education: '',
        years_experience: 0,
        years_education: 0,
        level: 'Junior',
      };
    } catch (error) {
      console.error('CV Parsing error:', error);
      throw new BadRequestException('Impossible de parser le CV');
    }
  }

  // =============================
  // SCORING FUNCTIONS
  // =============================

  private calculateExperienceScore(
    yearsExp: number,
    minYears: number,
    maxYears?: number,
  ): number {
    if (yearsExp < minYears) {
      return Math.max(0, (yearsExp / minYears) * 70);
    }
    if (maxYears && yearsExp > maxYears) {
      return 75; // Surqualifié mais OK
    }
    return 100; // Dans la plage
  }

  private calculateEducationScore(
    yearsEdu: number,
    minYearsEdu: number,
  ): number {
    if (yearsEdu < minYearsEdu) {
      return Math.max(0, (yearsEdu / minYearsEdu) * 60);
    }
    return 100;
  }

  private calculateSkillsScore(
    applicantSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[] = [],
  ): number {
    if (!applicantSkills || applicantSkills.length === 0) {
      return 0;
    }

    if (!requiredSkills || requiredSkills.length === 0) {
      return 100; // Pas de skills requis
    }

    // Comparer les skills (case-insensitive)
    const applicantSkillsLower = applicantSkills.map((s) => s.toLowerCase());

    const requiredMatches = requiredSkills.filter((skill) =>
      applicantSkillsLower.some((s) => s.includes(skill.toLowerCase())),
    ).length;

    const preferredMatches = preferredSkills.filter((skill) =>
      applicantSkillsLower.some((s) => s.includes(skill.toLowerCase())),
    ).length;

    const requiredScore =
      (requiredMatches / requiredSkills.length) * 100;
    const preferredBonus =
      preferredSkills.length > 0
        ? (preferredMatches / preferredSkills.length) * 20
        : 0;

    return Math.min(100, requiredScore + preferredBonus);
  }

  private calculateLevelScore(
    applicantLevel: string,
    requiredLevel: string,
  ): number {
    const levels: { [key: string]: number } = {
      'Junior': 1,
      'Intermédiaire': 2,
      'Senior/Expert': 3,
    };

    const applicantLevelValue = levels[applicantLevel] || 0;
    const requiredLevelValue = levels[requiredLevel] || 0;

    if (applicantLevelValue >= requiredLevelValue) {
      return 100;
    }
    if (applicantLevelValue === requiredLevelValue - 1) {
      return 70;
    }
    if (applicantLevelValue === requiredLevelValue - 2) {
      return 40;
    }
    return 20;
  }

  private calculateTotalScore(
    experienceScore: number,
    educationScore: number,
    skillsScore: number,
    levelScore: number,
    weights = { experience: 0.25, education: 0.15, skills: 0.4, level: 0.2 },
  ): number {
    const total =
      experienceScore * weights.experience +
      educationScore * weights.education +
      skillsScore * weights.skills +
      levelScore * weights.level;

    return Math.round(total);
  }

  // =============================
  // CREATE POST
  // =============================

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
      applicants: [],
      applicantsCount: 0,
      matchedApplicantsCount: 0,
    });

    return created.save();
  }

  // =============================
  // FIND ALL / FIND ONE
  // =============================

  async findAll(user?: { id?: string; role?: string }) {
    if (user?.role === UserRole.HR_MANAGER) {
      if (!user.id) {
        throw new BadRequestException('User id missing');
      }

      return this.postModel.find({
        createdById: String(user.id),
      });
    }

    return this.postModel.find({ isActive: true });
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

  // =============================
  // UPDATE POST
  // =============================

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

  // =============================
  // DELETE POST
  // =============================

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

  // =============================
  // APPLY TO POST (WITH CV PARSING)
  // =============================

  async applyToPost(
    postId: string,
    applicantDto: ApplyPostDto,
    cvFile?: Express.Multer.File,
  ) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const email = applicantDto.email.trim().toLowerCase();

    // Vérifier si candidat a déjà postulé
    const alreadyApplied = post.applicants.some(
      (applicant) => applicant.email.trim().toLowerCase() === email,
    );

    if (alreadyApplied) {
      throw new BadRequestException(
        'Vous avez déjà postulé à cette offre avec cet email',
      );
    }

    // Parser le CV si fichier fourni
    let cvData: CVParsingResult = {
      experience: '',
      education: '',
      years_experience: 0,
      years_education: 0,
      level: 'Junior',
    };

    if (cvFile) {
      try {
        cvData = await this.parseCV(cvFile.path);
      } catch (error) {
        console.error('CV parsing failed:', error);
        // Continuer sans parsing
      }
    }

    // Calculer les scores
    const scores = this.calculateApplicantScores(post, cvData);

    // Créer le nouvel applicant
    const newApplicant: any = {
      name: applicantDto.name,
      email,
      phone: applicantDto.phone,
      cvLink: applicantDto.cvLink,
      experience_text: cvData.experience,
      education_text: cvData.education,
      years_experience: cvData.years_experience,
      years_education: cvData.years_education,
      level: cvData.level,
      experienceScore: scores.experienceScore,
      educationScore: scores.educationScore,
      skillsScore: scores.skillsScore,
      levelScore: scores.levelScore,
      score: scores.totalScore,
      cvParsingStatus: cvFile ? 'success' : 'pending',
      appliedAt: new Date(),
      cvParsedAt: cvFile ? new Date() : undefined,
    };

    // Ajouter à la liste des candidats
    post.applicants.push(newApplicant);
    post.applicantsCount = post.applicants.length;

    // Compter les candidats avec score >= 70
    post.matchedApplicantsCount = post.applicants.filter(
      (a) => a.score >= 70,
    ).length;

    // Mettre à jour le score moyen du poste
    const avgScore =
      post.applicants.reduce((sum, a) => sum + (a.score || 0), 0) /
      post.applicants.length;
    post.score = Math.round(avgScore);

    // Nettoyer les fichiers CVs temporaires
    if (cvFile && fs.existsSync(cvFile.path)) {
      fs.unlinkSync(cvFile.path);
    }

    return post.save();
  }

  // =============================
  // CALCULATE APPLICANT SCORES
  // =============================

  private calculateApplicantScores(
    post: PostDocument,
    cvData: CVParsingResult,
  ) {
    const experienceScore = this.calculateExperienceScore(
      cvData.years_experience,
      post.minYearsExperience || 0,
      post.maxYearsExperience,
    );

    const educationScore = this.calculateEducationScore(
      cvData.years_education,
      post.minYearsEducation || 0,
    );

    const skillsScore = this.calculateSkillsScore(
      cvData.skills || [],
      post.requiredSkills || [],
      post.preferredSkills || [],
    );

    const levelScore = this.calculateLevelScore(
      cvData.level,
      post.requiredLevel,
    );

    const totalScore = this.calculateTotalScore(
      experienceScore,
      educationScore,
      skillsScore,
      levelScore,
    );

    return {
      experienceScore: Math.round(experienceScore),
      educationScore: Math.round(educationScore),
      skillsScore: Math.round(skillsScore),
      levelScore: Math.round(levelScore),
      totalScore,
    };
  }

  // =============================
  // GET APPLICANTS WITH SCORES
  // =============================

  async getApplicantsWithScores(
    postId: string,
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
          'Vous ne pouvez consulter que vos propres candidatures',
        );
      }
    }

    // Trier par score décroissant
    const sortedApplicants = [...post.applicants].sort(
      (a, b) => (b.score || 0) - (a.score || 0),
    );

    return {
      postId,
      postTitle: post.title,
      applicantsCount: post.applicantsCount,
      matchedApplicantsCount: post.matchedApplicantsCount,
      averageScore: post.score,
      applicants: sortedApplicants.map((app) => ({
        name: app.name,
        email: app.email,
        phone: app.phone,
        level: app.level,
        years_experience: app.years_experience,
        years_education: app.years_education,
        score: app.score,
        experienceScore: app.experienceScore,
        educationScore: app.educationScore,
        skillsScore: app.skillsScore,
        levelScore: app.levelScore,
        appliedAt: app.appliedAt,
        cvLink: app.cvLink,
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

    // Mettre à jour les compteurs
    post.applicantsCount = post.applicants.length;
    post.matchedApplicantsCount = post.applicants.filter(
      (a) => a.score >= 70,
    ).length;

    if (post.applicants.length > 0) {
      const avgScore =
        post.applicants.reduce((sum, a) => sum + (a.score || 0), 0) /
        post.applicants.length;
      post.score = Math.round(avgScore);
    } else {
      post.score = 0;
    }

    return post.save();
  }
}