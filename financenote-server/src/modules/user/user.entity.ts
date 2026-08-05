/**
 * 用户实体定义文件 (UserEntity)
 * 
 * 对应数据库表：`users`
 * 记录用户账号密码、邮箱、头像及注册创建时间。
 * 密码使用 bcrypt 算法进行安全哈希加密保存，绝对不存明文。
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { DocumentEntity } from '../document/entities/document.entity';
import { NoteEntity } from '../note/entities/note.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('increment', { comment: '用户唯一主键 ID' })
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true, comment: '用户名 (登录凭证)' })
  username: string;

  @Column({ type: 'varchar', length: 128, unique: true, comment: '电子邮箱' })
  email: string;

  @Column({ type: 'varchar', length: 255, comment: 'Bcrypt 加密哈希密码' })
  @Exclude({ toPlainOnly: true }) // 转化为 JSON 返回给前端时自动隐藏密码字段
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '用户头像 URL' })
  avatar: string;

  @CreateDateColumn({ comment: '账户注册时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '最后更新时间' })
  updatedAt: Date;

  // 一对多关联：一个用户可拥有多个上传的文档 (书籍/财报)
  @OneToMany(() => DocumentEntity, (document) => document.user)
  documents: DocumentEntity[];

  // 一对多关联：一个用户可创建多个阅读笔记
  @OneToMany(() => NoteEntity, (note) => note.user)
  notes: NoteEntity[];
}
