import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator';

export class UpdateTaskMarketingDto {
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
  budget?: number;

  @IsOptional()
  @IsNumber()
  expectedViews?: number;

  @IsOptional()
  @IsNumber()
  expectedLeads?: number;

  @IsOptional()
  @IsNumber()
  expectedConversions?: number;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  assignedTo?: { id: number };

  @IsOptional()
  @IsDate()
  scheduledEndDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}