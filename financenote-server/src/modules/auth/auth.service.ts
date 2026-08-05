/**
 * 认证与授权服务实现 (AuthService)
 * 
 * 功能职责：
 * 1. 处理用户注册，校验用户名冲突与密码哈希
 * 2. 校验用户登录凭证（账号密码）
 * 3. 签发 JWT AccessToken 供前端请求后续接口使用
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册逻辑
   */
  async register(registerDto: RegisterDto) {
    const user = await this.userService.createUser(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );

    // 注册成功后自动生成 Token
    const token = this.generateJwtToken(user);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken: token,
    };
  }

  /**
   * 用户登录逻辑
   */
  async login(loginDto: LoginDto) {
    const user = await this.userService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误！');
    }

    // 比对密码哈希
    const isPasswordMatch = await this.userService.validatePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('用户名或密码错误！');
    }

    // 登录成功签发令牌
    const token = this.generateJwtToken(user);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken: token,
    };
  }

  /**
   * 生成包含用户身份载荷的 JWT Token
   */
  private generateJwtToken(user: UserEntity): string {
    const payload = { sub: user.id, username: user.username };
    return this.jwtService.sign(payload);
  }
}
