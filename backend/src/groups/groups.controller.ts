import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  listGroups() {
    return this.groupsService.listGroups();
  }

  @Get(':id')
  getGroupById(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  createGroup(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(user.id, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  updateGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  deleteGroup(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.groupsService.deleteGroup(user.id, id);
  }

  @Put(':id/regenerate-code')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  regenerateJoinCode(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.groupsService.regenerateJoinCode(user.id, id);
  }
}
