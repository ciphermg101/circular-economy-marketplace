import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url')!;
    this.client = createClient({ url: redisUrl });
  }

  async connect() {
    await this.client.connect();
  }
}