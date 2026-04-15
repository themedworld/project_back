import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import { Request } from 'express';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { ROLE_CREATION_RULES } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // -------------------- LISTER TOUS LES UTILISATEURS --------------------
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  )
  async findAll(@Req() req: Request) {
    const requester = req['user'];
    if (!requester) {
      throw new BadRequestException('Requester not found in request');
    }

    // Super admin voit tout
    if (requester.role === UserRole.SUPER_ADMIN) {
      return this.userService.findAll();
    }

    // Tous les autres rôles : on récupère uniquement les users de la même company
    const companyId = requester.companyId;
    if (!companyId) {
      // Si l'utilisateur n'a pas de companyId et n'est pas super admin, on refuse
      throw new BadRequestException('Requester has no companyId');
    }

    const allUsersInCompany = await this.userService.findByCompany(companyId);

    // Rôles visibles selon ROLE_CREATION_RULES
    const visibleRoles = ROLE_CREATION_RULES[requester.role as keyof typeof ROLE_CREATION_RULES] || [];

    // Si aucun rôle visible => ne voit que lui-même
    if (visibleRoles.length === 0) {
      return allUsersInCompany.filter(u => u.id === requester.id);
    }

    // Filtrer par rôles visibles
    return allUsersInCompany.filter(u => visibleRoles.includes(u.role));
  }

  // -------------------- RÉCUPÉRER UN UTILISATEUR PAR ID --------------------
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  )
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const requester = req['user'];
    const targetUser = await this.userService.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (requester.role === UserRole.SUPER_ADMIN) {
      return targetUser;
    }

    // ADMIN_COMPANY : uniquement dans sa société
    if (requester.role === UserRole.ADMIN_COMPANY) {
      if (targetUser.company?.id === requester.companyId) {
        return targetUser;
      } else {
        throw new ForbiddenException('You cannot access users from another company');
      }
    }

    const visibleRoles = ROLE_CREATION_RULES[requester.role as keyof typeof ROLE_CREATION_RULES] || [];

    // Si ne voit que lui-même
    if (visibleRoles.length === 0) {
      if (targetUser.id === requester.id) {
        return targetUser;
      }
      throw new ForbiddenException('You cannot access this user');
    }

    // Si le rôle de la cible est dans les rôles visibles
    if (visibleRoles.includes(targetUser.role)) {
      // Vérifier company (si target a une company)
      if (targetUser.company?.id && targetUser.company.id !== requester.companyId) {
        throw new ForbiddenException('You cannot access users from another company');
      }
      return targetUser;
    }

    throw new ForbiddenException('You cannot access this user');
  }

  // -------------------- CRÉER UN UTILISATEUR --------------------
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
  )
  async create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const creator = req['user'];
    if (!creator) {
      throw new BadRequestException('Requester not found in request');
    }

    const desiredRole = createUserDto.role ?? UserRole.MEMBER;
    const allowedRoles = ROLE_CREATION_RULES[creator.role] ?? [];

    if (!allowedRoles.includes(desiredRole)) {
      throw new ForbiddenException(`Role ${creator.role} cannot create ${desiredRole}`);
    }

    // Forcer companyId côté serveur sauf pour SUPER_ADMIN
    let companyId: number | undefined;
    if (creator.role === UserRole.SUPER_ADMIN) {
      companyId = createUserDto.companyId;
      if (!companyId) {
        throw new BadRequestException('companyId is required when creating user as SUPER_ADMIN');
      }
    } else {
      // ignore la valeur envoyée par le front
      companyId = creator.companyId;
      if (!companyId) {
        throw new BadRequestException('Creator has no companyId');
      }
    }

    const payload = {
      ...createUserDto,
      role: desiredRole,
      company: companyId ? ({ id: companyId } as CompanyEntity) : null,
    };

    return this.userService.create(payload);
  }

  // -------------------- METTRE À JOUR UN UTILISATEUR --------------------
  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.AGENT_TELEPRO,
    UserRole.COMMERCIAL,
    UserRole.MARKETING_AGENT,
    UserRole.QUALITE_AGENT,
    UserRole.TECH_SUPPORT,
    UserRole.MEMBER,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const requester = req['user'];
    const targetUser = await this.userService.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (requester.role === UserRole.SUPER_ADMIN) {
      return this.userService.update(id, updateUserDto);
    }

    // Vérifier que la cible est dans la même company
    if (targetUser.company?.id !== requester.companyId) {
      throw new ForbiddenException('You cannot update users from another company');
    }

    const visibleRoles = ROLE_CREATION_RULES[requester.role as keyof typeof ROLE_CREATION_RULES] || [];

    // Si le requester ne peut pas gérer le rôle de la cible et n'est pas la cible elle-même
    if (!visibleRoles.includes(targetUser.role) && targetUser.id !== requester.id) {
      throw new ForbiddenException('You cannot update this user');
    }

    // ADMIN_COMPANY ne peut pas changer role ni companyId
    if (requester.role === UserRole.ADMIN_COMPANY) {
      delete updateUserDto.role;
      delete updateUserDto.companyId;
    }

    // Forcer companyId côté serveur si le requester n'est pas SUPER_ADMIN
    if (requester.role !== UserRole.SUPER_ADMIN) {
      // si updateUserDto contient companyId, on l'ignore
      delete updateUserDto.companyId;
    }

    return this.userService.update(id, updateUserDto);
  }

  // -------------------- SUPPRIMER UN UTILISATEUR --------------------
  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN_COMPANY,
    UserRole.MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.CALL_CENTER_MANAGER,
    UserRole.SALES_MANAGER,
    UserRole.MARKETING_MANAGER,
    UserRole.QUALITY_MANAGER,
    UserRole.HR_MANAGER,
  )
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const requester = req['user'];
    const targetUser = await this.userService.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (requester.role === UserRole.SUPER_ADMIN) {
      return this.userService.remove(id);
    }

    // Vérifier company
    if (targetUser.company?.id !== requester.companyId) {
      throw new ForbiddenException('You cannot delete users from another company');
    }

    const visibleRoles = ROLE_CREATION_RULES[requester.role as keyof typeof ROLE_CREATION_RULES] || [];

    if (!visibleRoles.includes(targetUser.role)) {
      throw new ForbiddenException('You cannot delete this user');
    }

    return this.userService.remove(id);
  }
}
