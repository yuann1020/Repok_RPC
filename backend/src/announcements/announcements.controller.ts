import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  async getActiveAnnouncements() {
    return this.announcementsService.getActiveAnnouncements();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.announcementsService.addComment(
      id,
      req.user.userId,
      createCommentDto.content,
    );
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.announcementsService.getComments(id);
  }
}
