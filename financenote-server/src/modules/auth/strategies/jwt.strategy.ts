/**
 * Passport JWT 鉴权策略解析实现 (JwtStrategy)
 * 
 * 核心逻辑：
 * 1. 自动从 HTTP 请求头的 Authorization: Bearer <Token> 中提取 Token。
 * 2. 使用环境中的 JWT_SECRET 校验签名是否合法及 Token 是否过期。
 * 3. 解密出 payload 中的 sub (userId)，并从数据库查找用户实体注入到 req.user 中。
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

export interface JwtPayload {
  sub: number;       // 用户唯一 ID
  username: string;  // 用户名
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'FinanceNote_Super_Secret_JWT_Key_2026_Secure'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Token 对应的用户不存在或已被禁用');
    }
    // 返回的对象会被 Passport 自动注入到 Express 的 Request 对象中 (req.user)
    return user;
  }
}
