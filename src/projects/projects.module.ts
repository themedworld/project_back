import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { UserModule } from '../user/user.module';
import { CompaniesModule } from '../companies/companies.module';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from 'src/user/entities/user.entity';
import { ProjectITEntity } from './entities/projectIT.entity';
import { ProjectMarketingEntity } from './entities/projectMarketing.entity';
import { ProjectCallCenterEntity } from './entities/projectCallCenter.entity';
import { TaskITEntity } from './entities/TaskITEntity.entity';
import { SprintITEntity } from './entities/SprintITEntity.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, UserEntity, ProjectITEntity, ProjectMarketingEntity, ProjectCallCenterEntity,TaskITEntity,SprintITEntity]),
    forwardRef(() => UserModule),
    forwardRef(() => CompaniesModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}