/**
 * 认证控制器 (AuthController)
 * 
 * 暴露路由：
 * - POST /api/auth/register : 用户注册
 * - POST /api/auth/login    : 用户登录
 * - GET  /api/auth/me       : 获取当前登录用户信息 (需 JWT 凭证)
 */

import { Controller, Post, Body, Get, UseGuards, Res, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserEntity } from '../user/user.entity';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

@ApiTags('认证与账户模块 Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // 免去 JWT 校验
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: '新用户账号注册' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    this.setAuthCookie(res, result.accessToken);
    return { user: result.user };
  }

  @Public() // 免去 JWT 校验
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '用户账号登录' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookie(res, result.accessToken);
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('fn_access_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return { message: '已退出登录' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前登录用户的个人资料' })
  async getProfile(@CurrentUser() user: UserEntity) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '修改当前用户密码' })
  async changePassword(@CurrentUser() user: UserEntity, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user, dto);
    return { message: '密码修改成功，请使用新密码登录' };
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('fn_access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
