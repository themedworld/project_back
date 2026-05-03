import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/user/entities/user.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';

export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

export enum DepartureReason {
  RESIGNATION = 'resignation',
  TERMINATION = 'termination',
  END_OF_CONTRACT = 'end_of_contract',
  RETIREMENT = 'retirement',
  OTHER = 'other',
}

export enum ContractType {
  CDI = 'cdi',
  CDD = 'cdd',
  STAGE = 'stage',
  FREELANCE = 'freelance',
}

@Entity('member_profiles')
@Index(['userId'], { unique: true })
@Index(['employmentStatus'])
@Index(['performanceRating'])
@Index(['attendanceRate'])
export class MemberProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // 1️⃣ Relations
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  userId: number;

  @ManyToOne(() => CompanyEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity | null;

  @Column({ nullable: true })
  companyId: number | null;

  // 2️⃣ Emploi (5 colonnes)
  @Column({ type: 'enum', enum: ContractType, default: ContractType.CDI })
  contractType: ContractType;

  @Column({ type: 'date' })
  hireDate: Date;

  @Column({ type: 'enum', enum: EmploymentStatus, default: EmploymentStatus.ACTIVE })
  employmentStatus: EmploymentStatus;

@Column({ type: 'varchar', length: 100, nullable: true })
position: string | null;

  // 3️⃣ Salaire (3 colonnes)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseSalary: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bonuses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCompensation: number;

  // 4️⃣ Performance (2 colonnes)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  performanceRating: number;

  @Column({ type: 'integer', default: 0 })
  projectsCompleted: number;

  // 5️⃣ Assiduité (2 colonnes)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  attendanceRate: number;

  @Column({ type: 'smallint', default: 0 })
  absenceCount: number;

  // 6️⃣ Départ (2 colonnes)
  @Column({ type: 'date', nullable: true })
  deactivationDate: Date | null;

  @Column({ type: 'enum', enum: DepartureReason, nullable: true })
  departureReason: DepartureReason | null;

  // 7️⃣ Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}