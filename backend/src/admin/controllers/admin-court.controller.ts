import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminCourtService } from '../services/admin-court.service';
import { CreateCourtAdminDto } from '../dto/create-court.admin.dto';
import { UpdateCourtAdminDto } from '../dto/update-court.admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/courts')
export class AdminCourtController {
  constructor(private readonly adminCourtService: AdminCourtService) {}

  @Post()
  async createCourt(@Body() dto: CreateCourtAdminDto) {
    return this.adminCourtService.createCourt(dto);
  }

  @Patch(':id')
  async updateCourt(@Param('id') id: string, @Body() dto: UpdateCourtAdminDto) {
    return this.adminCourtService.updateCourt(id, dto);
  }
}
