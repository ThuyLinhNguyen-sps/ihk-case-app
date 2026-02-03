import { Module } from '@nestjs/common';
import { VisaProfileController } from './visa-profile.controller';
import { VisaProfileService } from './visa-profile.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [VisaProfileController],
  providers: [VisaProfileService, PrismaService],
})
export class VisaProfileModule {}
