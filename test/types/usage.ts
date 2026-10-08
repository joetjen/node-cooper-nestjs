// Compiled, never run, by `npm run typecheck`: what a TypeScript
// application writes must type-check against `types/cooper-nestjs.d.ts`.

import { Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CooperConfigModule, CooperConfig, InjectCooper, getCooperToken, version } from 'cooper-nestjs';

interface DbConfig {
  host: string;
  port: number;
}

@Injectable()
class Repository {
  constructor(
    @InjectCooper('db') private readonly db: DbConfig,
    private readonly config: ConfigService,
    private readonly reader: CooperConfig,
  ) {}

  where(): string {
    const host: string = this.config.getOrThrow<string>('db.host');
    const port: number = this.reader.get('db.port', 5432);
    const present: boolean = this.reader.has(['dotted.key', 'inner']);
    return `${this.db.host}:${host}:${port}:${present}`;
  }
}

@Module({
  imports: [CooperConfigModule.forRoot({ root: '.', modules: { 'App.Secret': String } })],
  providers: [Repository],
})
export class AppModule {}

const token: string = getCooperToken('db');
const installed: string = version;

// @ts-expect-error -- an option cooper-config does not know
CooperConfigModule.forRoot({ isGlobal: true });

void [token, installed];
