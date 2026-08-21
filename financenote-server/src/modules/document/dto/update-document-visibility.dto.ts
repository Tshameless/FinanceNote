import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentVisibilityDto {
  @ApiProperty({ description: '是否对其他登录用户公开' })
  @IsBoolean()
  isPublic: boolean;
}
