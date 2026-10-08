# cooper-nestjs

cooper-nestjs is a [NestJS](https://nestjs.com) module that loads your
application's [CASC](https://github.com/joetjen/cooper/blob/main/guides/casc/CASC.md)
configuration once, at startup, and feeds it to
[`@nestjs/config`](https://docs.nestjs.com/techniques/configuration).

`ConfigService` stays the way you read your configuration, and so does
every third-party module you configure through it. What CASC replaces is
where the values come from: `.env` loading and configuration factories.
`.env` files are read by [`cooper`](https://github.com/joetjen/node-cooper)
itself. The loading and reading are
[`cooper-config`](https://github.com/joetjen/node-cooper-config)'s, so
`ConfigService`, this package and `require('cooper-config')` all read
the same configuration.

```text
# config/config.casc
#@version = 1.0

db {
  host      = "db.internal"
  port      = 5432
  *password = ${DB_PASSWORD}
  timeout   = 30s
}

mail {
  from = "noreply@example.com"
}

import "${COOPER_ENV}/*.casc"
```

```ts
@Module({
  imports: [CooperConfigModule.forRoot()],   // loads config/config.casc, once; global
})
export class AppModule {}

@Injectable()
export class Mailer {
  constructor(
    private readonly config: ConfigService,              // @nestjs/config, as always
    @InjectCooper('mail') private readonly mail: MailConfig,  // one block
  ) {}

  send() {
    const host = this.config.getOrThrow<string>('db.host');
    const from = this.mail.from;
  }
}
```

## Install

```sh
npm install cooper-nestjs @nestjs/config
```

NestJS 11 and 12 are supported, with `@nestjs/config` 4 and 12
respectively. Both are peer dependencies, so your own are used.
`@nestjs/config` is optional; see [Without `@nestjs/config`](#without-nestjsconfig).
`cooper-config` and `cooper` come along. You need Node.js 20.19 or
later.

The package is an ES module, because NestJS 12 is one. A CommonJS
application, such as a NestJS 11 app compiled from TypeScript, loads it
with `require()` as usual.

## `CooperConfigModule.forRoot(options?)`

Import it once, in the root module. It is global: every module sees
what it provides without importing it.

| | |
| --- | --- |
| options given | loads with them, cooper-config's load options (`path`, `root`, `env`, `dotenvDir`, `modules`, ...) |
| no options, something loaded | reads that: by `cooper-config` itself or `--import cooper-config/register` |
| no options, nothing loaded | loads `config/config.casc` under the project root |
| an unknown option | `TypeError` |
| the document does not load | `NestFactory.create()` rejects with `CooperConfigError`; the app never starts |

The project root is the directory of the nearest `package.json` above
the working directory.

It provides three things:

- **`ConfigService`**, from `@nestjs/config`, with the whole document
  loaded into it. `@nestjs/config` reads no `.env` file of its own.
- **Each top-level block** under `getCooperToken(name)`, injected with
  `@InjectCooper(name)`.
- **`CooperConfig`**, cooper-config's readers.

## Reading

### `ConfigService`

```ts
config.get('db.host')               // the value, or undefined
config.get('db.port', 5432)         // or a fallback
config.getOrThrow('db.host')        // or an error
config.get('db')                    // a whole block
```

A path that is in the document is read from the document, before
`process.env`. Byte sizes arrive as bytes and durations as
milliseconds. The [`cooper-config` README](https://github.com/joetjen/node-cooper-config#conversion)
has the full table, and how each block's secrets arrive. Every value is
deep-frozen.

Third-party modules read it the way they always have:

```ts
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => config.getOrThrow('db'),
});
```

### One block: `@InjectCooper(name)`

```ts
constructor(@InjectCooper('db') private readonly db: DbConfig) {}
```

The block is provided under `getCooperToken('db')`, for `inject:
[getCooperToken('db')]` in a factory provider, or `moduleRef.get(...)`.

### `CooperConfig`

```ts
constructor(private readonly reader: CooperConfig) {}

reader.get('db.port', 5432);    // the value, or the fallback
reader.require('db.host');      // the value, or a CooperConfigError naming the path
reader.has('db.replica');       // whether anything, null included, is there
reader.all();                   // the whole configuration
```

Paths are dotted (`'db.pool.size'`) or an array of segments for a key
holding a dot (`['dotted.key', 'inner']`).

## Without `@nestjs/config`

`@nestjs/config` is an optional peer. Without it, `forRoot()` provides
`CooperConfig` and the blocks, and there is no `ConfigService`.

## Per-environment configuration

`${COOPER_ENV}` names the environment (`dev`, `test`, `prod`), falling
back to `NODE_ENV`, and `.env.<env>` is chosen by it. See the
[`cooper-config` README](https://github.com/joetjen/node-cooper-config#per-environment-configuration-cooper_env).

## Testing

Point `forRoot()` at a fixture project:

```ts
const moduleRef = await Test.createTestingModule({
  imports: [CooperConfigModule.forRoot({ root: fixtureDir, dotenv: false })],
}).compile();
```

## Development

```sh
npm install
npm run precommit
```

`npm run precommit` type-checks the JSDoc (`tsc --checkJs --noEmit`)
and the TypeScript declarations, and runs the Mocha suite. See
[CONTRIBUTING.md](CONTRIBUTING.md) and the
[cheatsheet](guides/CHEATSHEET.md).

## License

Apache-2.0, see [LICENSE](LICENSE).
