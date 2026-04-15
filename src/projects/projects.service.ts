import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectITEntity } from './entities/projectIT.entity';
import { ProjectMarketingEntity } from './entities/projectMarketing.entity';
import { ProjectCallCenterEntity } from './entities/projectCallCenter.entity';
import { CreateProjectCallCenterDto } from './dto/create-project-callcenter.dto';
import { CreateProjectMarketingDto } from './dto/create-project-marketing.dto';
import { ProjectITDto } from './dto/create-project-it.dto';
import { SprintITEntity } from './entities/SprintITEntity.entity';
import { TaskITEntity } from './entities/TaskITEntity.entity';
import { CreateSprintITDto } from './dto/create-sprint-it.dto';
import { CreateTaskITDto } from './dto/create-task-it.dto';
import { UpdateSprintITDto } from './dto/update-sprint-it.dto';
import { UpdateTaskITDto } from './dto/update-task-it.dto';
import { TaskStatus } from './entities/TaskITEntity.entity';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,

    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,

    @InjectRepository(ProjectITEntity)
    private projectITRepo: Repository<ProjectITEntity>,

    @InjectRepository(ProjectMarketingEntity)
    private projectMarketingRepo: Repository<ProjectMarketingEntity>,

    @InjectRepository(ProjectCallCenterEntity)
    private projectCallCenterRepo: Repository<ProjectCallCenterEntity>,

    @InjectRepository(SprintITEntity)
    private sprintITRepo: Repository<SprintITEntity>,

    @InjectRepository(TaskITEntity)
    private taskITRepo: Repository<TaskITEntity>,
  ) {}


async create(dto: CreateProjectDto, creator: UserEntity) {
  // 1. Récupérer le créateur avec sa compagnie
  const managerWithCompany = await this.userRepo.findOne({
    where: { id: creator.id },
    relations: ['company'],
  });

  if (!managerWithCompany || !managerWithCompany.company) {
    throw new ForbiddenException("L'administrateur n'a pas de compagnie associée.");
  }

  const { projectManagerId, ...projectData } = dto;

  // 2. Créer l'instance du projet
  const project = this.projectRepo.create({
    ...projectData,
    createdBy: managerWithCompany, // On enregistre qui a créé
    company: managerWithCompany.company,
  });

  // 3. Affecter le Project Manager si fourni
  if (projectManagerId) {
    const pm = await this.userRepo.findOne({
      where: { 
        id: projectManagerId, 
        role: UserRole.PROJECT_MANAGER // Validation du rôle
      }
    });

    if (!pm) {
      throw new NotFoundException(`Le Project Manager avec l'ID ${projectManagerId} n'existe pas.`);
    }
    project.projectManager = pm;
  }

  return this.projectRepo.save(project);
}
// Ajoutez ceci dans ProjectsService
async addMembersByProjectMember(
  projectId: number,
  memberIds: number[],
  requester: UserEntity,
) {
  const project = await this.projectRepo.findOne({
    where: { id: projectId },
    relations: ['assignedTo', 'company', 'projectManager'],
  });

  if (!project) throw new NotFoundException('Project not found');

  // Vérifier que le requester est bien membre du projet ou le PM
  const isAssigned = (project.assignedTo || []).some(u => u.id === requester.id);
  if (!isAssigned && project.projectManager?.id !== requester.id) {
    throw new ForbiddenException('You are not a member of this project');
  }

  if (!project.company) throw new NotFoundException('Project company not found');

  // Récupérer les utilisateurs valides (même company)
  const members = await this.userRepo.find({
    where: {
      id: In(memberIds),
      company: { id: project.company.id },
    },
  });

  if (!members || members.length === 0) {
    throw new NotFoundException('No valid members found to add');
  }

  // Fusionner sans doublons
  const existing = project.assignedTo || [];
  const existingIds = new Set(existing.map(u => u.id));
  const toAdd = members.filter(m => !existingIds.has(m.id));

  if (toAdd.length === 0) {
    // Rien à ajouter
    return { message: 'No new members to add', added: [] };
  }

  project.assignedTo = [...existing, ...toAdd];

  const saved = await this.projectRepo.save(project);

  // Retourner la liste des membres ajoutés pour plus de clarté
  return {
    message: 'Members added successfully',
    added: toAdd.map(m => ({ id: m.id, email: m.email, fullname: m.fullname })),
    projectId: saved.id,
  };
}
// projects.service.ts (ajoutez la méthode suivante dans ProjectsService)

async getProjectDetails(
  projectId: number,
  options?: { memberSearch?: string; includeDomainDetails?: boolean },
) {
  const includeDomain = options?.includeDomainDetails ?? true;
  // Charger le projet avec les relations de base
  const project = await this.projectRepo.findOne({
    where: { id: projectId },
    relations: ['createdBy', 'projectManager', 'assignedTo', 'company', 'itDetails', 'marketingDetails', 'callCenterDetails'],
  });

  if (!project) throw new NotFoundException('Project not found');

  // Filtrer les membres en mémoire si memberSearch est fourni
  let filteredMembers = project.assignedTo || [];
  if (options?.memberSearch && options.memberSearch.trim().length > 0) {
    const q = options.memberSearch.trim().toLowerCase();
    filteredMembers = filteredMembers.filter(u => {
      const name = (u.fullname || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  // Préparer les détails selon le domaine
 let domainDetails:
    | ProjectITEntity
    | ProjectMarketingEntity
    | ProjectCallCenterEntity
    | null = null;

  if (includeDomain) {
    switch (project.domain) {
      case 'IT':
        domainDetails = project.itDetails ?? null;
        break;
      case 'Marketing':
        domainDetails = project.marketingDetails ?? null;
        break;
      case 'CallCenter':
        domainDetails = project.callCenterDetails ?? null;
        break;
      default:
        domainDetails = null;
    }
  }

  // Retour structuré
  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      domain: project.domain,
      startDate: project.startDate,
      endDate: project.endDate,
      company: project.company ? { id: project.company.id, name: project.company.name } : null,
      createdBy: project.createdBy ? { id: project.createdBy.id, name: project.createdBy.fullname, email: project.createdBy.email } : null,
      projectManager: project.projectManager ? { id: project.projectManager.id, name: project.projectManager.fullname, email: project.projectManager.email } : null,
      assignedTo: filteredMembers.map(u => ({ id: u.id, name: u.fullname, email: u.email })),
      isActive: project.isActive,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    domainDetails,
  };
}

  // 🔹 Manager affecte un Project Manager
  async assignProjectManager(
    projectId: number,
    pmId: number,
    manager: UserEntity,
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['company', 'manager'],
    });

    if (!project) throw new NotFoundException('Project not found');

    if (!manager || !manager.company || project.company.id !== manager.company.id) {
      throw new ForbiddenException('You cannot assign PM to a project from another company');
    }

    const pm = await this.userRepo.findOne({
      where: { id: pmId, role: UserRole.PROJECT_MANAGER },
      relations: ['company'],
    });

    if (!pm) throw new NotFoundException('Project Manager not found');

    if (!pm.company || pm.company.id !== manager.company.id) {
      throw new ForbiddenException('PM belongs to a different company');
    }

    project.projectManager = pm;
    return this.projectRepo.save(project);
  }

  // 🔹 Project Manager ajoute des membres
  async addMembers(
    projectId: number,
    memberIds: number[],
    projectManager: UserEntity,
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['assignedTo', 'company', 'projectManager', 'createdBy'],
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.projectManager?.id !== projectManager.id) {
      throw new ForbiddenException('You are not the Project Manager of this project');
    }

    if (!project.company) throw new NotFoundException('Project company not found');

    const members = await this.userRepo.find({
      where: {
        id: In(memberIds),
        company: { id: project.company.id },
      },
    });

    project.assignedTo = [...(project.assignedTo || []), ...members];

    return this.projectRepo.save(project);
  }

  // 🔹 Voir tous les projets
async findAll(user: UserEntity) {
  const relations = ['createdBy', 'projectManager', 'assignedTo', 'company'];

  if (user.role === UserRole.SUPER_ADMIN) {
    return this.projectRepo.find({ relations });
  }

  // Vérification de sécurité pour le companyId
  if (!user.companyId) {
    // Si l'utilisateur n'a pas de compagnie (et n'est pas super_admin), 
    // il ne peut voir aucun projet de compagnie.
    return []; 
  }

  if (user.role === UserRole.ADMIN_COMPANY) {
    return this.projectRepo.find({
      // On force le type ou on s'assure qu'il n'est pas nul ici
      where: { company: { id: user.companyId as number } },
      relations,
    });
  }

  if (user.role === UserRole.MANAGER) {
    return this.projectRepo.find({
      where: { createdBy: { id: user.id } },
      relations,
    });
  }

  if (user.role === UserRole.PROJECT_MANAGER) {
    return this.projectRepo.find({
      where: { projectManager: { id: user.id } },
      relations,
    });
  }

  // Pour les membres/agents
  return this.projectRepo.find({
    where: { assignedTo: { id: user.id } },
    relations,
  });
}
  // 🔹 Voir un projet
  async findOne(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['createdBy','projectManager','assignedTo','company'],
    });

    if (!project) throw new NotFoundException('Project not found');

    return project;
  }

  // 🔹 Mettre à jour projet
  async update(id: number, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findOne({ where: { id } });

    if (!project) throw new NotFoundException('Project not found');

    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  // 🔹 Supprimer projet
  async remove(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    await this.projectRepo.remove(project);
    return { message: 'Project removed successfully' };
  }

  async addITDetails(project: ProjectEntity, dto: ProjectITDto) {
    const itDetails = this.projectITRepo.create({ ...dto, project });
    return this.projectITRepo.save(itDetails);
  }

  // 🔹 Créer les détails Marketing
  async addMarketingDetails(project: ProjectEntity, dto: CreateProjectMarketingDto) {
    const marketingDetails = this.projectMarketingRepo.create({ ...dto, project });
    return this.projectMarketingRepo.save(marketingDetails);
  }

  // 🔹 Créer les détails CallCenter
  async addCallCenterDetails(project: ProjectEntity, dto: CreateProjectCallCenterDto) {
    const callCenterDetails = this.projectCallCenterRepo.create({ ...dto, project });
    return this.projectCallCenterRepo.save(callCenterDetails);
  }

  // 🔹 Initialiser automatiquement selon le domaine
  async initializeDomainDetails(project: ProjectEntity, dto: any) {
    switch (project.domain) {
      case 'IT':
        return this.addITDetails(project, dto as ProjectITDto);
      case 'Marketing':
        return this.addMarketingDetails(project, dto as CreateProjectMarketingDto);
      case 'CallCenter':
        return this.addCallCenterDetails(project, dto as CreateProjectCallCenterDto);
      default:
        return null; // pour "Other", pas de détails spécifiques
    }
  }

  // 🔹 Récupérer les sprints d'un project IT (exposé via service)
  async getSprintsOfProjectIT(projectId: number): Promise<SprintITEntity[]> {
    const projectIT = await this.projectITRepo.findOne({
      where: { id: projectId },
      relations: ['sprints', 'sprints.tasks'],
    });
    if (!projectIT) throw new NotFoundException('Project IT not found');
    return projectIT.sprints;
  }

  // 🔹 Récupérer les tâches d'un sprint (exposé via service)
  async getTasksOfSprint(sprintId: number): Promise<TaskITEntity[]> {
    const sprint = await this.sprintITRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks'],
    });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint.tasks;
  }

  async createSprintsWithTasks(
    projectId: number,
    sprintsDto: CreateSprintITDto[],
  ): Promise<SprintITEntity[]> {
    // Récupérer le projet IT
    const projectIT = await this.projectITRepo.findOne({ where: { id: projectId } });
    if (!projectIT) throw new NotFoundException('Project IT not found');

    const createdSprints: SprintITEntity[] = [];

    for (const sprintDto of sprintsDto) {
      // Créer le sprint
      const sprint = this.sprintITRepo.create({
        name: sprintDto.name,
        startDate: new Date(sprintDto.startDate),
        endDate: new Date(sprintDto.endDate),
        status: sprintDto.status || 'planned',
        totalStoryPoints: sprintDto.totalStoryPoints,
        priority: sprintDto.priority,
        risks: sprintDto.risks,
        dependencies: sprintDto.dependencies,
        teamSize: sprintDto.teamSize,
        complexity: sprintDto.complexity,
        additionalNotes: sprintDto.additionalNotes,
        projectIT: projectIT,
      });

      const savedSprint = await this.sprintITRepo.save(sprint);

      // Créer les tâches pour ce sprint
      if (sprintDto.tasks && sprintDto.tasks.length > 0) {
        for (const taskDto of sprintDto.tasks) {
          const task = this.taskITRepo.create({
            title: taskDto.title,
            description: taskDto.description,
            type: taskDto.type,
            status: taskDto.status,
            priority: taskDto.priority,
            storyPoints: taskDto.storyPoints,
            estimatedHours: taskDto.estimatedHours,
            dependencies: taskDto.dependencies,
            risks: taskDto.risks,
            complexity: taskDto.complexity,
            additionalNotes: taskDto.additionalNotes,
            sprint: savedSprint,
          });

          // Optionnel : assigner un utilisateur si assignedToId est fourni
          if (taskDto.assignedToId) {
            task.assignedTo = { id: taskDto.assignedToId } as UserEntity;
          }

          await this.taskITRepo.save(task);
        }
      }

      createdSprints.push(savedSprint);
    }

    return createdSprints;
  }

  async addTaskToSprint(
    sprintId: number,
    taskDto: CreateTaskITDto,
  ): Promise<TaskITEntity> {
    // 1️⃣ Récupérer le sprint
    const sprint = await this.sprintITRepo.findOne({
      where: { id: sprintId },
      relations: ['tasks'],
    });
    if (!sprint) throw new NotFoundException('Sprint IT not found');

    // 2️⃣ Créer la tâche et l'associer au sprint
    const task = this.taskITRepo.create({
      title: taskDto.title,
      description: taskDto.description,
      type: taskDto.type,
      status: taskDto.status,
      priority: taskDto.priority,
      storyPoints: taskDto.storyPoints,
      estimatedHours: taskDto.estimatedHours,
      dependencies: taskDto.dependencies,
      risks: taskDto.risks,
      complexity: taskDto.complexity,
      additionalNotes: taskDto.additionalNotes,
      sprint: sprint,
    });

    // 3️⃣ Optionnel : assigner un utilisateur si provided
    if (taskDto.assignedToId) {
      task.assignedTo = { id: taskDto.assignedToId } as UserEntity;
    }

    // 4️⃣ Sauvegarder la tâche
    const savedTask = await this.taskITRepo.save(task);

    return savedTask;
  }

  async assignTaskToMember(
    taskId: number,          // ID de la tâche à assigner
    memberId: number,        // ID du membre à qui assigner
    projectManager: UserEntity, // Le Project Manager qui effectue l'action
  ): Promise<TaskITEntity> {
    // 1️⃣ Récupérer la tâche avec le sprint et le projet IT
    const task = await this.taskITRepo.findOne({
      where: { id: taskId },
      relations: ['sprint', 'sprint.projectIT', 'sprint.projectIT.project'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // 2���⃣ Vérifier que le Project Manager gère bien le projet
    const projectIT = task.sprint.projectIT;
    if (!projectIT || !projectIT.project) {
      throw new NotFoundException('Project IT or parent project not found');
    }

    const project = await this.projectRepo.findOne({
      where: { id: projectIT.project.id },
      relations: ['manager', 'manager.company'],
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.projectManager?.id !== projectManager.id) {
      throw new ForbiddenException('You are not the Project Manager of this project');
    }

    // 3️⃣ Vérifier que le membre appartient à la même entreprise
    if ( !project.company) {
      throw new NotFoundException('Project manager or company not configured for this project');
    }

    const companyId = project.company.id;

    const member = await this.userRepo.findOne({
      where: { id: memberId, company: { id: companyId } },
    });

    if (!member) throw new NotFoundException('Member not found in your company');

    // 4️⃣ Assigner le membre à la tâche
    task.assignedTo = member;

    // 5️⃣ Sauvegarder et retourner la tâche
    return this.taskITRepo.save(task);
  }

  async assignProjectToPM(
    projectId: number,       // ID du projet à affecter
    pmId: number,            // ID du Project Manager
    manager: UserEntity,     // Le manager qui effectue l'action
  ): Promise<ProjectEntity> {
    // 1️⃣ Récupérer le projet avec son manager actuel et la société
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['company', 'manager'],
    });

    if (!project) throw new NotFoundException('Project not found');

    // 2️⃣ Vérifier que le manager courant appartient à la même société
    if (!manager || !manager.company || project.company.id !== manager.company.id) {
      throw new ForbiddenException('You cannot assign a PM to a project from another company');
    }

    // 3️⃣ Vérifier que le Project Manager existe et appartient à la même société
    const pm = await this.userRepo.findOne({
      where: { id: pmId, role: UserRole.PROJECT_MANAGER },
      relations: ['company'],
    });

    if (!pm) throw new NotFoundException('Project Manager not found');

    if (!pm.company || pm.company.id !== manager.company.id) {
      throw new ForbiddenException('The PM belongs to a different company');
    }

    // 4️⃣ Affecter le Project Manager au projet
    project.projectManager = pm;

    // 5️⃣ Sauvegarder et retourner le projet mis à jour
    return this.projectRepo.save(project);
  }
  async getSprintById(sprintId: number): Promise<SprintITEntity> {
  const sprint = await this.sprintITRepo.findOne({   // ← sprintITRepo
    where: { id: sprintId },
    relations: ['tasks', 'tasks.assignedTo'],
  });
  if (!sprint) throw new NotFoundException(`Sprint #${sprintId} introuvable`);
  return sprint;
}

async updateSprint(sprintId: number, dto: UpdateSprintITDto, user: UserEntity): Promise<SprintITEntity> {
  const sprint = await this.getSprintById(sprintId);
  Object.assign(sprint, dto);
  return this.sprintITRepo.save(sprint);             // ← sprintITRepo
}

async deleteSprint(sprintId: number, user: UserEntity): Promise<{ message: string }> {
  const sprint = await this.getSprintById(sprintId);
  await this.sprintITRepo.remove(sprint);            // ← sprintITRepo
  return { message: `Sprint #${sprintId} supprimé avec succès` };
}

// ── TÂCHES ───────────────────────────────────────────────

async getTaskById(taskId: number): Promise<TaskITEntity> {
  const task = await this.taskITRepo.findOne({       // ← taskITRepo
    where: { id: taskId },
    relations: ['assignedTo', 'sprint'],
  });
  if (!task) throw new NotFoundException(`Tâche #${taskId} introuvable`);
  return task;
}

async updateTask(
  taskId: number,
  dto: UpdateTaskITDto,
  user: UserEntity,
): Promise<TaskITEntity> {
  const task = await this.getTaskById(taskId);
  const { assignedTo, ...rest } = dto as any;
  Object.assign(task, rest);

  if (assignedTo?.id) {
    const member = await this.userRepo.findOne({ where: { id: assignedTo.id } });
    if (!member) throw new NotFoundException(`Membre #${assignedTo.id} introuvable`);
    task.assignedTo = member;
  }

  // ✅ AJOUTER JUSTE CE BLOC
  if (dto.status === 'DONE' && !task.actualEndDate) {
    task.actualEndDate = new Date();
    if (task.scheduledEndDate) {
      const delayMs = task.actualEndDate.getTime() - task.scheduledEndDate.getTime();
      task.delayHours = Math.round((delayMs / (1000 * 60 * 60)) * 100) / 100;
    }
  }

  return this.taskITRepo.save(task);
}

async deleteTask(taskId: number, user: UserEntity): Promise<{ message: string }> {
  const task = await this.getTaskById(taskId);
  await this.taskITRepo.remove(task);                // ← taskITRepo
  return { message: `Tâche #${taskId} supprimée avec succès` };
}

async updateTaskStatus(taskId: number, status: string, user: UserEntity): Promise<TaskITEntity> {
  const task = await this.getTaskById(taskId);
  task.status = status as any;
  return this.taskITRepo.save(task);                 // ← taskITRepo
}
// Ajouter ces 2 méthodes à ProjectsService

async getDeveloperDelayStats(developerId: number) {
  // Récupérer toutes les tâches complétées du développeur
  const tasks = await this.taskITRepo.find({
    where: { 
      assignedTo: { id: developerId }, 
      status: TaskStatus.DONE, // ✅ Utiliser l'enum
    },
  });

  const totalDelay = tasks.reduce((sum, t) => sum + (t.delayHours || 0), 0);
  const onTimeCount = tasks.filter(t => (t.delayHours || 0) <= 0).length;

  return {
    developerId,
    totalTasks: tasks.length,
    onTimeCount,
    lateCount: tasks.length - onTimeCount,
    totalDelayHours: totalDelay,
    averageDelay: tasks.length > 0 ? Math.round((totalDelay / tasks.length) * 100) / 100 : 0,
    isPerforming: tasks.length > 0 && (onTimeCount / tasks.length) >= 0.8, // 80% à temps
  };
}

async getTaskDelayInfo(taskId: number) {
  const task = await this.getTaskById(taskId);
  
  return {
    taskId: task.id,
    title: task.title,
    scheduledEnd: task.scheduledEndDate,
    actualEnd: task.actualEndDate,
    delayHours: task.delayHours || 0,
    status: !task.actualEndDate 
      ? '⏳ Non complété' 
      : (task.delayHours || 0) > 0 
        ? `⚠️ En retard de ${task.delayHours}h` 
        : `✅ Avance de ${Math.abs(task.delayHours || 0)}h`,
  };
}
}