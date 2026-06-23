import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  listEvents() {
    return this.eventsService.listEvents();
  }

  @Get(':id')
  getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  createEvent(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(user.id, dto);
  }

  @Post(':id/register')
  registerForEvent(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.registerForEvent(user.id, id);
  }

  @Get(':id/registrations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  listRegistrations(@Param('id') id: string) {
    return this.eventsService.listRegistrations(id);
  }
}
