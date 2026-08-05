/**
 * 笔记创建与高亮划线 DTO 校验类
 */

import { IsString, IsOptional, IsArray, IsUUID, IsInt, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: '笔记标题', example: '贵州茅台 2024 年报核心估值分析' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Markdown 格式正文', example: '## 经营现金流变动分析\n净利润匹配度高...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '关联的文档 ID' })
  @IsOptional()
  @IsUUID()
  docId?: string;

  @ApiPropertyOptional({ description: '标签列表', example: [' valuation', 'cashflow'] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class CreateAnnotationDto {
  @ApiProperty({ description: '关联的文档 ID' })
  @IsUUID()
  docId: string;

  @ApiPropertyOptional({ description: '关联的笔记 ID' })
  @IsOptional()
  @IsUUID()
  noteId?: string;

  @ApiProperty({ description: '页码 (1-based)', example: 42 })
  @IsInt()
  pageNum: number;

  @ApiProperty({ description: '选区相对坐标对象', example: { x: 0.1, y: 0.2, width: 0.8, height: 0.05 } })
  @IsObject()
  rectCoords: Record<string, any>;

  @ApiProperty({ description: '划选的原文片段', example: '经营活动产生的现金流量净额为 665.9 亿元' })
  @IsString()
  selectedText: string;

  @ApiPropertyOptional({ description: '高亮颜色', example: '#ffeb3b' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '随手批注', example: '同比暴增，需重点关注销售回款率' })
  @IsOptional()
  @IsString()
  comment?: string;
}
