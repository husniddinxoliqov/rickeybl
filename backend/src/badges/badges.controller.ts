import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AwardBadgeDto } from './dto/award-badge.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { BadgesService } from './badges.service';

@Controller('badges')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  listBadges() {
    return this.badgesService.listBadges();
  }

  @Get('mine')
  getMyBadges(@CurrentUser() user: AuthenticatedUser) {
    return this.badgesService.getMyBadges(user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  createBadge(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBadgeDto) {
    return this.badgesService.createBadge(user.id, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  updateBadge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBadgeDto,
  ) {
    return this.badgesService.updateBadge(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ROOT)
  deleteBadge(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.badgesService.deleteBadge(user.id, id);
  }

  @Post('award')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ROOT)
  awardBadge(@CurrentUser() user: AuthenticatedUser, @Body() dto: AwardBadgeDto) {
    return this.badgesService.awardBadge(user, dto);
  }
}
