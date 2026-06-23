import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('profile')
  createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentProfileDto,
  ) {
    return this.studentsService.createProfile(user.id, dto);
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getMyProfile(user.id);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  listPending() {
    return this.studentsService.listPending();
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  approvePending(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.approvePending(user.id, id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  rejectPending(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.rejectPending(user.id, id);
  }
}
