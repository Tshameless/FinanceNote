/**
 * 用户服务实现 (UserService)
 * 
 * 核心功能：
 * 1. 按用户名或邮箱查找用户
 * 2. 创建新用户账号并进行密码 bcrypt 加密
 * 3. 校验密码正确性
 */

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * 按 ID 查询用户信息
   */
  async findById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID 为 ${id} 的用户不存在`);
    }
    return user;
  }

  /**
   * 按用户名查找用户 (登录验证使用)
   */
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * 按电子邮箱查找用户
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * 创建注册新用户账号
   */
  async createUser(username: string, email: string, rawPassword: string): Promise<UserEntity> {
    // 1. 查重
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ConflictException('该用户名或电子邮箱已被注册，请更换！');
    }

    // 2. 密码 bcrypt 加密 (盐值 rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 3. 实例化并保存用户
    const newUser = this.userRepository.create({
      username,
      email,
      passwordHash,
    });

    return this.userRepository.save(newUser);
  }

  /**
   * 校验明文密码与加密哈希对比是否匹配
   */
  async validatePassword(rawPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(rawPassword, passwordHash);
  }

  async updatePassword(user: UserEntity, rawPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(rawPassword, salt);
    await this.userRepository.save(user);
  }
}
