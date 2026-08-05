/**
 * 自定义装饰器：@CurrentUser()
 * 
 * 用途：
 * 在 Controller 的方法参数中直接注入当前登录用户的身份信息（从经过 JwtAuthGuard 校验后的 req.user 提取）。
 * 
 * 示例用法：
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果传入了具体字段名称 (例如 @CurrentUser('id'))，则仅返回该字段
    return data ? user?.[data] : user;
  },
);
