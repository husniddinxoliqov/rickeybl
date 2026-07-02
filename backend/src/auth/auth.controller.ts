import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { CredentialLoginDto } from './dto/credential-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {}

  @Post('telegram')
  telegramAuth(@Body() dto: TelegramAuthDto) {
    return this.authService.telegramAuth(dto.initData);
  }

  @Post('admin-login')
  adminLogin(@Req() req: Request, @Body() dto: AdminLoginDto) {
    this.authRateLimitService.consume(`admin:${req.ip ?? 'unknown'}`);
    return this.authService.adminLogin(dto);
  }

  @Post('staff-login')
  staffLogin(@Req() req: Request, @Body() dto: CredentialLoginDto) {
    this.authRateLimitService.consume(`staff:${req.ip ?? 'unknown'}`);
    return this.authService.credentialLogin(dto, [UserRole.STAFF]);
  }

  @Post('credential-login')
  credentialLogin(@Req() req: Request, @Body() dto: CredentialLoginDto) {
    this.authRateLimitService.consume(`credential:${req.ip ?? 'unknown'}`);
    return this.authService.credentialLogin(dto, [UserRole.STAFF, UserRole.ROOT]);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthenticatedUser, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
