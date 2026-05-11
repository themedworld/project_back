import { IsString, IsDate, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskMarketingDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsNumber()
  estimatedHours?: number;

  @IsOptional() @IsNumber()
  budget?: number;

  @IsOptional() @IsNumber()
  expectedViews?: number;

  @IsOptional() @IsNumber()
  expectedClicks?: number;

  @IsOptional() @IsNumber()
  expectedLeads?: number;

  @IsOptional() @IsNumber()
  expectedConversions?: number;

  @IsOptional() @IsNumber()
  expectedCTR?: number;

  @IsOptional() @IsString()
  channel?: string;

  @IsOptional() @IsNumber()
  assignedToId?: number;

  @IsOptional()
  @Type(() => Date)
  scheduledEndDate?: Date;

  // ✅ Champs AI — whitelist les accepte maintenant
  @IsOptional() @IsNumber()
  aiEstimatedHours?: number;
}

export class CreateSprintMarketingDto {
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional() @IsNumber()
  totalBudget?: number;

  @IsOptional() @IsString()
  campaignType?: string;

  @IsOptional() @IsString()
  targetAudience?: string;

  @IsOptional() @IsNumber()
  expectedReach?: number;

  @IsOptional() @IsNumber()
  expectedLeads?: number;

  @IsOptional() @IsNumber()
  expectedROI?: number;

  @IsOptional() @IsString()
  channels?: string;

  @IsOptional() @IsString()
  goals?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  complexity?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })  // ← CLEF : valide chaque tâche
  @Type(() => CreateTaskMarketingDto)
  tasks?: CreateTaskMarketingDto[];
}