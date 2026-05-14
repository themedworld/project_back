// ─── create-task-it.dto.ts ───────────────────────────────────────────────────
import { IsString, IsOptional, IsEnum, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType, TaskStatus, TaskPriority } from '../entities/TaskITEntity.entity';

export class AssignedToIdDto {
  @IsInt()
  id: number;
}

export class CreateTaskITDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;


  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsInt()
  @IsOptional()
  storyPoints?: number;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  // ── Scores (int 1-5) ───────────────────────────────────────────────────────
  // These were missing — NestJS whitelist stripped them silently.
  @IsInt()
  @IsOptional()
  complexityScore?: number;

  @IsInt()
  @IsOptional()
  riskLevel?: number;

  // ── Text fields ────────────────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  complexity?: string; // 'Low' | 'Medium' | 'High' — text label, separate from complexityScore

  @IsString()
  @IsOptional()
  dependencies?: string;

  @IsString()
  @IsOptional()
  risks?: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  @IsNumber()
  @IsOptional()
  delayHours?: number;
  
  @IsOptional()
  scheduledStartDate?: Date | string | null;

  @IsOptional()
  scheduledEndDate?: Date | string | null;

  // ── Assignee ───────────────────────────────────────────────────────────────
  // assignedToId: kept for backward compat (createSprintsWithTasks uses it)
  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsInt()
  @IsOptional()
  sprintId?: number;

  // assignedTo: { id } — sent by serializeTask() on PATCH
  // Validated as a nested object so whitelist doesn't strip it.
  @IsOptional()
  @Type(() => AssignedToIdDto)
  assignedTo?: AssignedToIdDto | null;
}