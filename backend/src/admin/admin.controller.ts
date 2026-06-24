import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AdminService } from './admin.service';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ROOT)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('audit-logs')
  listAuditLogs() {
    return this.adminService.listAuditLogs();
  }

  @Get('staff/:userId/assignments')
  listStaffAssignments(@Param('userId') userId: string) {
    return this.adminService.listStaffAssignments(userId);
  }

  @Post('staff/:userId/assignments')
  createStaffAssignment(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: CreateStaffAssignmentDto,
  ) {
    return this.adminService.createStaffAssignment(actor.id, userId, dto);
  }

  @Delete('staff/assignments/:assignmentId')
  deleteStaffAssignment(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.adminService.deleteStaffAssignment(actor.id, assignmentId);
  }
}
