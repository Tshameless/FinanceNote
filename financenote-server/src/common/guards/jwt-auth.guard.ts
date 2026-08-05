/**
 * 全局 / 路由级 JWT 身份鉴权守卫 (JwtAuthGuard)
 * 
 * 核心逻辑：
 * 1. 检查路由方法或类上是否标注了 @Public() 装饰器，若是则直接放行。
 * 2. 否则通过 Passport JWT 策略校验 HTTP 请求头中的 Authorization: Bearer <Token>。
 * 3. 若 Token 无效或缺失，抛出 401 Unauthorized 异常，彻底阻断未授权的敏感资源读取。
 */

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否有 @Public() 标记
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // 如果存在验证错误或用户信息为空，抛出 401 异常
    if (err || !user) {
      throw err || new UnauthorizedException('请求未授权或 Token 已失效，请重新登录！');
    }
    return user;
  }
}
