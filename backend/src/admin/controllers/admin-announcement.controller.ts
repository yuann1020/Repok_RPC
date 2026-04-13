import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateAnnouncementAdminDto } from '../dto/create-announcement.admin.dto';
import { UpdateAnnouncementAdminDto } from '../dto/update-announcement.admin.dto';
import { AdminAnnouncementService } from '../services/admin-announcement.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/announcements')
export class AdminAnnouncementController {
  constructor(
    private readonly adminAnnouncementService: AdminAnnouncementService,
  ) {}

  @Get()
  async getAllAnnouncements() {
    return this.adminAnnouncementService.getAllAnnouncements();
  }

  @Post()
  async createAnnouncement(
    @Request() req: any,
    @Body() dto: CreateAnnouncementAdminDto,
  ) {
    return this.adminAnnouncementService.createAnnouncement(
      req.user.userId,
      dto,
    );
  }

  @Patch(':id')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementAdminDto,
  ) {
    return this.adminAnnouncementService.updateAnnouncement(id, dto);
  }

  @Delete(':id')
  async deleteAnnouncement(@Param('id') id: string) {
    return this.adminAnnouncementService.deleteAnnouncement(id);
  }
}
