import { IsString, IsDate, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateSprintMarketingDto {
  @IsString()
  name: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsNumber()
  totalBudget: number;

  @IsOptional()
  @IsString()
  campaignType: string;

  @IsOptional()
  @IsString()
  targetAudience: string;

  @IsOptional()
  @IsNumber()
  expectedReach: number;

  @IsOptional()
  @IsNumber()
  expectedLeads: number;

  @IsOptional()
  @IsNumber()
  expectedROI: number;

  @IsOptional()
  @IsString()
  channels: string;

  @IsOptional()
  @IsString()
  goals: string;

  @IsOptional()
  @IsArray()
  tasks?: CreateTaskMarketingDto[];
}

export class CreateTaskMarketingDto {
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
  budget: number;

  @IsOptional()
  @IsNumber()
  expectedViews: number;

  @IsOptional()
  @IsNumber()
  expectedClicks: number;

  @IsOptional()
  @IsNumber()
  expectedLeads: number;

  @IsOptional()
  @IsNumber()
  expectedConversions: number;

  @IsOptional()
  @IsNumber()
  expectedCTR: number;

  @IsOptional()
  @IsString()
  channel: string;

  @IsOptional()
  @IsNumber()
  assignedToId: number;

  @IsOptional()
  @IsDate()
  scheduledEndDate: Date;
}