/**
 * AI 研读提问 DTO 校验传输类
 */

import { IsString, IsUUID, IsOptional, IsInt, Min, Max, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RagQueryDto {
  @ApiPropertyOptional({ description: '目标文档 ID (可选)', example: 'd3b07384-d113-460a-85d7-1d67417e94e9' })
  @IsOptional()
  @IsUUID()
  docId?: string;

  @ApiProperty({ description: '用户提问内容', example: '该公司的经营活动现金流量变动的主要原因是什么？' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  query: string;

  @ApiPropertyOptional({ description: '当前处于的 PDF 物理页码 (优先检索当前页及附近页)', example: 42 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  currentPage?: number;

  @ApiPropertyOptional({ description: '检索最大切块数量 (Top K)', example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number = 5;
}
