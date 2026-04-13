import { Controller, Get, Param, Query } from '@nestjs/common';
import { CourtService } from './court.service';
import { GetCourtsFilterDto } from './dto/get-courts-filter.dto';

@Controller('courts')
export class CourtController {
  constructor(private readonly courtService: CourtService) {}

  @Get()
  async getCourts(@Query() filterDto: GetCourtsFilterDto) {
    return this.courtService.findAll(filterDto);
  }

  @Get(':id')
  async getCourtById(@Param('id') id: string) {
    return this.courtService.findOne(id);
  }
}
