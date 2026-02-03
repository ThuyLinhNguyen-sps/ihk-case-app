import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CaseModule } from './case/case.module';
import { VisaProfileModule } from './visa-profile/visa-profile.module';


@Module({
  imports: [PrismaModule, AuthModule,CaseModule, VisaProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
