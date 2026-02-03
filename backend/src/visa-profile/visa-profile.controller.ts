import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { VisaProfileService } from './visa-profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cases/:caseId/visa-profile')
export class VisaProfileController {
  constructor(private service: VisaProfileService) {}

  @Get()
  get(@Param('caseId') caseId: string) {
    return this.service.getByCaseId(Number(caseId));
  }

  @Put()
  save(@Param('caseId') caseId: string, @Body() body: any) {
    return this.service.upsert(Number(caseId), body);
  }
}
