import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsDate,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import {
  ContractType,
  EmploymentStatus,
  DepartureReason,
} from '../entities/member-profile.entity';
import { Type } from 'class-transformer';

export class CreateMemberProfileDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  companyId?: number;

  @IsEnum(ContractType)
  contractType: ContractType;

  @Type(() => Date)
  @IsDate()
  hireDate: Date;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;
}

export class UpdateMemberProfileDto {
  // ── Emploi ──────────────────────────────────────────────
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hireDate?: Date;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  // ── Salaire ─────────────────────────────────────────────
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonuses?: number;

  // ── Performance ─────────────────────────────────────────
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  performanceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  projectsCompleted?: number;

  // ── Assiduité ───────────────────────────────────────────
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  attendanceRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  absenceCount?: number;

  // ── Départ ──────────────────────────────────────────────
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deactivationDate?: Date | null;

  @IsOptional()
  @IsEnum(DepartureReason)
  departureReason?: DepartureReason | null;
}