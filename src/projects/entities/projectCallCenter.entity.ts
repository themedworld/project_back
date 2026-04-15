import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('project_callcenter')
export class ProjectCallCenterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation One-to-One avec Project
  @OneToOne(() => ProjectEntity, project => project.callCenterDetails, { onDelete: 'CASCADE' })
  @JoinColumn()
  project: ProjectEntity;

  // Informations opérationnelles
  @Column({ type: 'int', nullable: true })
  numberOfAgents: number; // Nombre d'agents assignés

  @Column({ type: 'int', nullable: true })
  numberOfCallsPerDay: number; // Volume de calls estimé

  @Column({ nullable: true })
  callTypes: string; // Ex: "Support, Vente, Technique"

  @Column({ nullable: true })
  slaTarget: string; // SLA: "80% calls < 1 min"

  @Column({ nullable: true })
  averageHandleTime: string; // Durée moyenne d'appel

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedBudget: number; // Budget pour le projet call center

  @Column({ type: 'int', nullable: true })
  estimatedDurationDays: number; // Durée estimée du projet

  @Column({ nullable: true })
  mainGoals: string; // Satisfaction client, Résolution rapide, Conversion

  @Column({ nullable: true })
  keyMetrics: string; // CSAT, FCR, AHT, NPS, % SLA atteint

  @Column({ nullable: true })
  dependencies: string; // Systèmes CRM, Formation agents, logiciels téléphoniques

  @Column({ nullable: true })
  risks: string; // Absentéisme, Volume d'appel plus élevé que prévu

  @Column({ nullable: true })
  additionalNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
