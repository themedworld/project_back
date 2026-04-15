import { IsString, IsOptional, IsEnum, IsInt, IsNumber } from 'class-validator';
import { TaskType, TaskStatus, TaskPriority } from '../entities/TaskITEntity.entity';

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

  @IsString()
  @IsOptional()
  dependencies?: string;

  @IsString()
  @IsOptional()
  risks?: string;

  @IsString()
  @IsOptional()
  complexity?: string; // 'Low' | 'Medium' | 'High'

  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsInt()
  @IsOptional()
  sprintId?: number;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  scheduledEndDate?: Date;
}