import { IsOptional, IsNumber, IsString, IsEnum, IsDate } from 'class-validator';
import { ContractType, EmploymentStatus, DepartureReason } from '../entities/member-profile.entity';

export class CreateMemberProfileDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  companyId?: number;

  @IsEnum(ContractType)
  contractType: ContractType;

  @IsDate()
  hireDate: Date;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsNumber()
  baseSalary?: number;
}

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsNumber()
  performanceRating?: number;

  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  attendanceRate?: number;

  @IsOptional()
  @IsDate()
  deactivationDate?: Date;

  @IsOptional()
  @IsEnum(DepartureReason)
  departureReason?: DepartureReason;
}