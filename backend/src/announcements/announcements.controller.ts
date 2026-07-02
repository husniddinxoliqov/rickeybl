import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedUser) {
    return this.announcementsService.list(actor);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  create(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(actor, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(actor, id, dto);
  }
}
