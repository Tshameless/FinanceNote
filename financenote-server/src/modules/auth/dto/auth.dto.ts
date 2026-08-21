/**
 * 用户注册与登录请求 DTO (Data Transfer Objects)
 * 
 * 作用：
 * 配合 Class-Validator 对前端提交的 username / password / email 进行强类型格式校验。
 */

import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'investor_john' })
  @IsString({ message: '用户名必须为字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名最少包含 3 个字符' })
  @MaxLength(32, { message: '用户名不能超过 32 个字符' })
  username: string;

  @ApiProperty({ description: '电子邮箱', example: 'john@example.com' })
  @IsEmail({}, { message: '电子邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString({ message: '密码必须为字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MaxLength(128, { message: '密码不能超过 128 个字符' })
  @MinLength(6, { message: '密码最少需要 6 个字符' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'investor_john' })
  @IsString({ message: '用户名必须为字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(32, { message: '用户名不能超过 32 个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsString({ message: '密码必须为字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MaxLength(128, { message: '密码不能超过 128 个字符' })
  password: string;
}
