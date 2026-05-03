import { IsString, IsDate, IsOptional, IsNumber } from 'class-validator';

export class UpdateSprintCallCenterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  targetAgents?: number;

  @IsOptional()
  @IsNumber()
  expectedCallVolume?: number;

  @IsOptional()
  @IsNumber()
  budgetAllocated?: number;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  trainingContent?: string;
}