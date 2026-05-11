import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaskMarketingDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()          // ✅ FIX #5 : string pas number
  priority?: string;

  @IsOptional() @IsNumber()
  estimatedHours?: number;

  @IsOptional() @IsNumber()
  budget?: number;

  @IsOptional() @IsNumber()
  expectedViews?: number;

  @IsOptional() @IsNumber()
  expectedClicks?: number;           // ✅ FIX : champ manquant ajouté

  @IsOptional() @IsNumber()
  expectedLeads?: number;

  @IsOptional() @IsNumber()
  expectedConversions?: number;

  @IsOptional() @IsNumber()
  expectedCTR?: number;              // ✅ FIX #3 : number cohérent

  @IsOptional() @IsString()
  channel?: string;

  @IsOptional() @IsNumber()
  assignedToId?: number;             // ✅ FIX #4 : plat, pas { id: number }

  @IsOptional() @IsString()
  type?: string;                     // ✅ FIX : champ manquant ajouté

  @IsOptional()
  @Type(() => Date)
  scheduledEndDate?: Date;
}