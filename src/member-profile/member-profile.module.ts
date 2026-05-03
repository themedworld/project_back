import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberProfileEntity } from './entities/member-profile.entity';
import { MemberProfileService } from './member-profile.service';
import { MemberProfileController } from './member-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MemberProfileEntity])],
  providers: [MemberProfileService],
  controllers: [MemberProfileController],
  exports: [MemberProfileService],
})
export class MemberProfileModule {}