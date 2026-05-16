import { IsString, IsDate, IsOptional, IsNumber, IsArray,IsDateString } from 'class-validator';

export class CreateSprintCallCenterDto {
  @IsString()
  name: string;

  @IsDateString() startDate: string; 
  @IsDateString() endDate: string;    

  @IsOptional()
  @IsNumber()
  targetAgents: number;

  @IsOptional()
  @IsNumber()
  expectedCallVolume: number;

  @IsOptional()
  @IsNumber()
  targetConversionRate: number;

  @IsOptional()
  @IsNumber()
  budgetAllocated: number;

  @IsOptional()
  @IsNumber()
  qualityScoreTarget: number;

  @IsOptional()
  @IsString()
  trainingContent: string;

  @IsOptional()
  @IsString()
  scriptTemplates: string;

  @IsOptional()
  @IsString()
  goals: string;

  @IsOptional()
  @IsArray()
  tasks?: CreateTaskCallCenterDto[];
}

export class CreateTaskCallCenterDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  priority: string;

  @IsOptional()
  @IsNumber()
  estimatedHours: number;

  @IsOptional()
  @IsNumber()
  targetAgentCount: number;

  @IsOptional()
  @IsNumber()
  expectedCallsPerAgent: number;

  @IsOptional()
  @IsNumber()
  targetConversionRate: number;

  @IsOptional()
  @IsNumber()
  qualityScoreTarget: number;

  @IsOptional()
  @IsString()
  scriptContent: string;

  @IsOptional()
  @IsNumber()
  assignedToId: number;

  @IsOptional() @IsDateString() scheduledStartDate: string;  // ← était @IsDate()
  @IsOptional() @IsDateString() scheduledEndDate: string;    // ← était @IsDate()
}