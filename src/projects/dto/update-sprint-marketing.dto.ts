import { IsString, IsDate, IsOptional, IsNumber } from 'class-validator';

export class UpdateSprintMarketingDto {
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
  totalBudget?: number;

  @IsOptional()
  @IsNumber()
  spentBudget?: number;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  channels?: string;
}