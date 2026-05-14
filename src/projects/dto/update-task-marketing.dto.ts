import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
 
class AssignedToDto {
  @IsNumber()
  id: number;
}
 
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
  @IsString()
  priority?: string;
 
  @IsOptional()
  @IsString()
  type?: string;
 
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
  expectedClicks?: number;
 
  @IsOptional()
  @IsNumber()
  expectedLeads?: number;
 
  @IsOptional()
  @IsNumber()
  expectedConversions?: number;
 
  @IsOptional()
  @IsNumber()
  expectedCTR?: number;
 
  @IsOptional()
  @IsString()
  channel?: string;
 
  // ✅ Format { id } depuis le front (cohérent avec le service)
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AssignedToDto)
  assignedTo?: AssignedToDto;
 
  // ✅ Compatibilité ancienne API (format plat)
  @IsOptional()
  @IsNumber()
  assignedToId?: number;
 
  // ✅ Date de début ajoutée
  @IsOptional()
  @Type(() => Date)
  scheduledStartDate?: Date | null;
 
  @IsOptional()
  @Type(() => Date)
  scheduledEndDate?: Date | null;
}
 