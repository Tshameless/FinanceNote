/**
 * 文件上传元数据传输对象 (UploadDocumentDto)
 */

import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocType, FileFormat } from '../entities/document.entity';
import { Type } from 'class-transformer';

export class UploadDocumentDto {
  @ApiProperty({ description: '文档标题', example: '贵州茅台 2024 年年度报告' })
  @IsString()
  title: string;

  @ApiProperty({ description: '文档分类', enum: DocType, example: DocType.FINANCIAL_REPORT })
  @IsEnum(DocType)
  docType: DocType;

  @ApiProperty({ description: '文件格式', enum: FileFormat, example: FileFormat.PDF })
  @IsEnum(FileFormat)
  fileFormat: FileFormat;

  @ApiPropertyOptional({ description: '股票代码 (财报用)', example: '600519.SH' })
  @IsOptional()
  @IsString()
  stockCode?: string;

  @ApiPropertyOptional({ description: '公司名称 (财报用)', example: '贵州茅台' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: '报告年份', example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reportYear?: number;

  @ApiPropertyOptional({ description: '报告季度', example: 'ANNUAL' })
  @IsOptional()
  @IsString()
  reportQuarter?: string;

  @ApiPropertyOptional({ description: '作者 (图书用)', example: '巴菲特' })
  @IsOptional()
  @IsString()
  author?: string;
}
