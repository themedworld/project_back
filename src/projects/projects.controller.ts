import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Delete, 
  ParseIntPipe,
  UseGuards,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';
import { CreateProjectCallCenterDto } from './dto/create-project-callcenter.dto';
import { CreateProjectMarketingDto } from './dto/create-project-marketing.dto';
import { ProjectITDto } from './dto/create-project-it.dto';
import { CreateTaskITDto } from './dto/create-task-it.dto';
import { CreateSprintITDto } from './dto/create-sprint-it.dto';
import { AddMembersByMemberDto } from './dto/add-members-by-member.dto';
// Guards / Roles - ajustez les chemins si nécessaire
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Query } from '@nestjs/common';

import { UpdateSprintITDto } from './dto/update-sprint-it.dto';
import { UpdateTaskITDto } from './dto/update-task-it.dto';

interface RequestWithUser extends Request {
  user?: UserEntity;
}

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 🔹 Créer un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Post()
  async createProject(
    @Body() dto: CreateProjectDto,
    @Req() req: RequestWithUser,
  ) {
    const manager = req.user as UserEntity;
    return this.projectsService.create(dto, manager);
  }
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles( UserRole.PROJECT_MANAGER)
@Patch(':projectId/add-members-by-member')
async addMembersByMember(
  @Param('projectId', ParseIntPipe) projectId: number,
  @Body() dto: AddMembersByMemberDto,
  @Req() req: RequestWithUser,
) {
  const requester = req.user as UserEntity;
  return this.projectsService.addMembersByProjectMember(
    projectId,
    dto.memberIds,
    requester,
  );
}
// projects.controller.ts (ajoutez l'endpoint suivant)



@UseGuards(JwtAuthGuard, RolesGuard)

@Get(':id/details')
async getProjectDetails(
  @Param('id', ParseIntPipe) id: number,
  @Query('memberSearch') memberSearch?: string,
  @Query('includeDomainDetails') includeDomainDetails?: string, // 'true'|'false'
) {
  const includeDomain = includeDomainDetails === undefined ? true : includeDomainDetails === 'true';
  return this.projectsService.getProjectDetails(id, { memberSearch, includeDomainDetails: includeDomain });
}

  // 🔹 Affecter un Project Manager à un projet (Manager only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Patch(':projectId/assign-pm/:pmId')
  async assignProjectManager(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pmId', ParseIntPipe) pmId: number,
    @Req() req: RequestWithUser,
  ) {
    const manager = req.user as UserEntity;
    return this.projectsService.assignProjectManager(projectId, pmId, manager);
  }

  // 🔹 Ajouter des membres à un projet (Project Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Patch(':projectId/add-members')
  async addMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body('memberIds') memberIds: number[],
    @Req() req: RequestWithUser,
  ) {
    const projectManager = req.user as UserEntity;
    return this.projectsService.addMembers(projectId, memberIds, projectManager);
  }

  // 🔹 Ajouter détails IT (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER , UserRole.PROJECT_MANAGER)
  @Post(':projectId/it-details')
  async addITDetails(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: ProjectITDto,
  ) {
    const project = await this.projectsService.findOne(projectId);
    return this.projectsService.addITDetails(project, dto);
  }

  // 🔹 Ajouter détails Marketing (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Post(':projectId/marketing-details')
  async addMarketingDetails(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectMarketingDto,
  ) {
    const project = await this.projectsService.findOne(projectId);
    return this.projectsService.addMarketingDetails(project, dto);
  }

  // 🔹 Ajouter détails CallCenter (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Post(':projectId/callcenter-details')
  async addCallCenterDetails(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectCallCenterDto,
  ) {
    const project = await this.projectsService.findOne(projectId);
    return this.projectsService.addCallCenterDetails(project, dto);
  }

  // 🔹 Initialiser automatiquement les détails selon le domaine (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PROJECT_MANAGER)
  @Post(':projectId/init-domain')
  async initializeDomain(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: ProjectITDto | CreateProjectMarketingDto | CreateProjectCallCenterDto,
  ) {
    const project = await this.projectsService.findOne(projectId);
    return this.projectsService.initializeDomainDetails(project, dto);
  }

  // 🔹 Voir tous les projets (authentifié)
@UseGuards(JwtAuthGuard)
@Get()
async findAll(@Req() req) {
  // On récupère l'utilisateur injecté par le JwtStrategy
  const user = req.user; 
  return this.projectsService.findAll(user);
}

  // 🔹 Voir un projet (authentifié)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  // 🔹 Mettre à jour un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  // 🔹 Supprimer un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }




  // 🔹 Affecter une tâche d'un sprint à un membre (Project Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Patch('task/:taskId/assign/:memberId')
  async assignTaskToMember(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Req() req: RequestWithUser,
  ) {
    const projectManager = req.user as UserEntity;
    return this.projectsService.assignTaskToMember(taskId, memberId, projectManager);
  }

  // 🔹 Récupérer tous les sprints d’un projet IT (authentifié)
  @UseGuards(JwtAuthGuard)
  @Get(':projectId/sprints')
  async getSprints(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.getSprintsOfProjectIT(projectId);
  }

  // 🔹 Récupérer toutes les tâches d’un sprint (authentifié)
  @UseGuards(JwtAuthGuard)
  @Get('sprint/:sprintId/tasks')
  async getTasksOfSprint(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.projectsService.getTasksOfSprint(sprintId);
  }

  // 🔹 Affecter un Project Manager à un projet (Manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @Patch(':projectId/assign-to-pm/:pmId')
  async assignProjectToPM(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pmId', ParseIntPipe) pmId: number,
    @Req() req: RequestWithUser,
  ) {
    const manager = req.user as UserEntity;
    return this.projectsService.assignProjectToPM(projectId, pmId, manager);
  } @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post(':projectId/sprints')
  async createSprintsWithTasks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() sprintsDto: CreateSprintITDto[],
  ) {
    return this.projectsService.createSprintsWithTasks(projectId, sprintsDto);
  }



  @UseGuards(JwtAuthGuard)
  @Get('sprints/:sprintId')
  async getSprintById(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.projectsService.getSprintById(sprintId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('sprints/:sprintId')
  async updateSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() dto: UpdateSprintITDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateSprint(sprintId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('sprints/:sprintId')
  async deleteSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteSprint(sprintId, req.user as UserEntity);
  }

  // ============================================================
  // TÂCHES
  // ============================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER)
  @Post('sprints/:sprintId/tasks')
  async addTaskToSprint(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() taskDto: CreateTaskITDto,
  ) {
    return this.projectsService.addTaskToSprint(sprintId, taskDto);
  }

 

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  async getTaskById(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.projectsService.getTaskById(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Patch('tasks/:taskId')
  async updateTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskITDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateTask(taskId, dto, req.user as UserEntity);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROJECT_MANAGER, UserRole.MANAGER)
  @Delete('tasks/:taskId')
  async deleteTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.deleteTask(taskId, req.user as UserEntity);
  }


@Get('developer/:developerId/delay-stats')
async getDeveloperDelayStats(
  @Param('developerId', ParseIntPipe) developerId: number,
) {
  return this.projectsService.getDeveloperDelayStats(developerId);
}

@Get('tasks/:taskId/delay-info')
async getTaskDelayInfo(@Param('taskId', ParseIntPipe) taskId: number) {
  return this.projectsService.getTaskDelayInfo(taskId);
}


  @UseGuards(JwtAuthGuard)
  @Patch('tasks/:taskId/status')
  async updateTaskStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body('status') status: string,
    @Req() req: RequestWithUser,
  ) {
    return this.projectsService.updateTaskStatus(taskId, status, req.user as UserEntity);
  }
}