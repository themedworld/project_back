import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberProfileEntity } from './entities/member-profile.entity';
import { CreateMemberProfileDto, UpdateMemberProfileDto } from './dto/create-member-profile.dto';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class MemberProfileService {
  constructor(
    @InjectRepository(MemberProfileEntity)
    private profileRepo: Repository<MemberProfileEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  /**
   * ✅ Vérifier que l'utilisateur est un MEMBER
   */
  private async verifyUserIsMember(userId: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} introuvable`);
    }

    if (user.role !== UserRole.MEMBER) {
      throw new ForbiddenException(
        `Impossible de créer un profil pour un utilisateur qui n'est pas MEMBER. Rôle actuel: ${user.role}`,
      );
    }

    return user;
  }

  /**
   * ✅ Vérifier les permissions de l'utilisateur requérant
   */
  private async checkPermissions(
    requesterUserId: number,
    targetUserId: number,
  ): Promise<{ requester: UserEntity; target: UserEntity }> {
    // Récupérer les deux utilisateurs
    const [requester, target] = await Promise.all([
      this.userRepo.findOne({
        where: { id: requesterUserId },
        relations: ['company'],
      }),
      this.userRepo.findOne({
        where: { id: targetUserId },
        relations: ['company'],
      }),
    ]);

    if (!requester) {
      throw new NotFoundException(
        `Utilisateur requérant ${requesterUserId} introuvable`,
      );
    }

    if (!target) {
      throw new NotFoundException(`Utilisateur cible ${targetUserId} introuvable`);
    }

    // SUPER_ADMIN peut tout faire
    if (requester.role === UserRole.SUPER_ADMIN) {
      return { requester, target };
    }

    // ADMIN_COMPANY ou HR_MANAGER peuvent gérer les MEMBERS de leur compagnie
    if (
      requester.role === UserRole.ADMIN_COMPANY ||
      requester.role === UserRole.HR_MANAGER
    ) {
      // Vérifier que la cible est un MEMBER
      if (target.role !== UserRole.MEMBER) {
        throw new ForbiddenException(
          `Impossible de gérer un profil pour un utilisateur qui n'est pas MEMBER. Rôle: ${target.role}`,
        );
      }

      // Vérifier que la cible est dans la même compagnie
      if (target.companyId !== requester.companyId) {
        throw new ForbiddenException(
          `Vous ne pouvez gérer que les profils des members de votre compagnie`,
        );
      }

      return { requester, target };
    }

    // Les autres rôles ne peuvent pas accéder aux profils d'autres utilisateurs
    throw new ForbiddenException(
      `Votre rôle (${requester.role}) n'a pas les permissions pour gérer les profils`,
    );
  }

  /**
   * ✅ Créer un profil pour un MEMBER
   */
  async create(
    dto: CreateMemberProfileDto,
    requesterUserId?: number,
  ): Promise<MemberProfileEntity> {
    // Vérifier que l'utilisateur est un MEMBER
    const targetUser = await this.verifyUserIsMember(dto.userId);

    // Si le requester est fourni, vérifier les permissions
    if (requesterUserId) {
      await this.checkPermissions(requesterUserId, dto.userId);
    }

    // Vérifier qu'un profil n'existe pas déjà
    const existingProfile = await this.profileRepo.findOne({
      where: { userId: dto.userId },
    });

    if (existingProfile) {
      throw new ForbiddenException(
        `Un profil existe déjà pour cet utilisateur`,
      );
    }

    // Créer le profil
    const profile = this.profileRepo.create({
      ...dto,
      companyId: targetUser.companyId,
    });

    return this.profileRepo.save(profile);
  }

  /**
   * ✅ Récupérer le profil d'un MEMBER
   */
  async getProfile(
    userId: number,
    requesterUserId?: number,
  ): Promise<MemberProfileEntity> {
    // Si le requester est fourni, vérifier les permissions
    if (requesterUserId) {
      await this.checkPermissions(requesterUserId, userId);
    }

    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'company'],
    });

    if (!profile) {
      throw new NotFoundException(`Profil introuvable pour l'utilisateur ${userId}`);
    }

    return profile;
  }

  /**
   * ✅ Mettre à jour le profil d'un MEMBER
   */
  async updateProfile(
    userId: number,
    dto: UpdateMemberProfileDto,
    requesterUserId?: number,
  ): Promise<MemberProfileEntity> {
    // Si le requester est fourni, vérifier les permissions
    if (requesterUserId) {
      await this.checkPermissions(requesterUserId, userId);
    }

    const profile = await this.getProfile(userId);

    // Mettre à jour les champs autorisés
    Object.assign(profile, dto);

    return this.profileRepo.save(profile);
  }

  /**
   * ✅ Récupérer tous les profils des MEMBERS d'une compagnie
   */
  async getAllProfiles(requesterUserId?: number): Promise<MemberProfileEntity[]> {
    let query = this.profileRepo.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.company', 'company');

    // Si le requester est fourni, filtrer selon son rôle et sa compagnie
    if (requesterUserId) {
      const requester = await this.userRepo.findOne({
        where: { id: requesterUserId },
      });

      if (!requester) {
        throw new NotFoundException(`Utilisateur requérant ${requesterUserId} introuvable`);
      }

      // SUPER_ADMIN voit tout
      if (requester.role !== UserRole.SUPER_ADMIN) {
        // ADMIN_COMPANY et HR_MANAGER voient seulement les profils de leur compagnie
        if (
          requester.role === UserRole.ADMIN_COMPANY ||
          requester.role === UserRole.HR_MANAGER
        ) {
          query = query.where('profile.companyId = :companyId', {
            companyId: requester.companyId,
          });
        } else {
          // Les autres rôles n'ont pas accès
          throw new ForbiddenException(
            `Votre rôle (${requester.role}) n'a pas les permissions pour lister les profils`,
          );
        }
      }
    }

    return query.getMany();
  }

  /**
   * ✅ Récupérer mon profil (pour l'utilisateur connecté)
   */
  async getMyProfile(userId: number): Promise<MemberProfileEntity> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'company'],
    });

    if (!profile) {
      throw new NotFoundException(`Aucun profil trouvé pour votre compte`);
    }

    return profile;
  }
}