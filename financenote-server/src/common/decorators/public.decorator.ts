/**
 * 自定义装饰器：@Public()
 * 
 * 用途：
 * 用于标识公开可访问的路由接口（免去 JWT 鉴权校验，如登录、注册）。
 * 
 * 示例用法：
 * @Public()
 * @Post('login')
 * login() { ... }
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
