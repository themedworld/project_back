import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator';

export class UpdateTaskCallCenterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  targetAgentCount?: number;

  @IsOptional()
  @IsNumber()
  targetConversionRate?: number;

  @IsOptional()
  @IsNumber()
  qualityScoreTarget?: number;

  @IsOptional()
  @IsString()
  scriptContent?: string;

  @IsOptional()
  assignedTo?: { id: number };

  @IsOptional()
  @IsDate()
  scheduledEndDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}