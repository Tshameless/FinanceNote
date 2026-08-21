import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DocumentModule } from '../document/document.module';

@Module({ imports: [DocumentModule], controllers: [HealthController] })
export class HealthModule {}
