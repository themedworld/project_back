import { IsOptional, IsString, IsNumber, IsDecimal, IsInt } from 'class-validator';

export class ProjectITDto {
  
  @IsOptional()
  @IsString()
  programmingLanguages?: string;

  @IsOptional()
  @IsString()
  framework?: string; 

  @IsOptional()
  @IsString()
  database?: string; 

  @IsOptional()
  @IsString()
  serverDetails?: string; 
  @IsOptional()
  @IsString()
  architecture?: string; 

  @IsOptional()
  @IsString()
  apiIntegration?: string; 

  @IsOptional()
  @IsString()
  securityRequirements?: string; // OAuth2, JWT, SSL/TLS

  @IsOptional()
  @IsString()
  devOpsRequirements?: string; // CI/CD, Docker, Jenkins

  // 🔹 Infos pour planification et estimation
  @IsOptional()
  @IsInt()
  estimatedDurationDays?: number; // durée estimée en jours

  @IsOptional()
  @IsDecimal()
  estimatedCost?: number; // coût estimé

  @IsOptional()
  @IsString()
  priority?: string; // High, Medium, Low

  @IsOptional()
  @IsString()
  businessImpact?: string; // Critical, Important, Normal

  @IsOptional()
  @IsInt()
  teamSize?: number; // nombre de membres nécessaires

  @IsOptional()
  @IsString()
  complexity?: string; // Low, Medium, High

  // 🔹 Découpage des modules et livrables
  @IsOptional()
  @IsString()
  mainModules?: string; // Auth, Payment, Dashboard, etc.

  @IsOptional()
  @IsString()
  keyDeliverables?: string; // API v1, Frontend v1

  @IsOptional()
  @IsString()
  dependencies?: string; // autres projets ou services nécessaires

  @IsOptional()
  @IsString()
  risks?: string; // risques identifiés (retard, bug critique, etc.)

  @IsOptional()
  @IsString()
  additionalNotes?: string; // infos diverses, remarques, liens docs
}
