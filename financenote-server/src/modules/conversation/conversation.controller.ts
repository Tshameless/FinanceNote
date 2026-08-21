import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/user.entity';
import { ConversationService } from './conversation.service';

@ApiTags('研读会话')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Get()
  list(@CurrentUser() user: UserEntity, @Query('docId') docId?: string) { return this.service.list(user.id, docId); }

  @Get(':id/messages')
  history(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.service.history(user.id, id); }
}
