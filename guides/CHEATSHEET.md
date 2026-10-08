# cooper-nestjs cheatsheet

## Startup

```ts
@Module({ imports: [CooperConfigModule.forRoot(options?)] })   // once, global
export class AppModule {}
```

| Call | Loads |
| --- | --- |
| `forRoot(options)` | with `options`, always |
| `forRoot()` | nothing if already loaded, else the defaults |

| | |
| --- | --- |
| options | cooper-config's: `path`, `root`, `env`, `dotenv*`, `resolvers`, `tags`, `importSchemes`, `modules`, `cache`, `watchEnv` |
| unknown option | `TypeError` |
| document does not load | `NestFactory.create()` / `compile()` rejects with `CooperConfigError` |
| no `config/config.casc` | empty configuration |
| `.env` | read by cooper for `${...}`; not by `@nestjs/config`, not into `process.env` |

## Reading

```ts
constructor(
  private config: ConfigService,                 // @nestjs/config
  @InjectCooper('db') private db: DbConfig,      // one top-level block
  private reader: CooperConfig,                  // cooper-config's readers
) {}

config.get('db.host')            config.getOrThrow('db.host')
config.get('db.port', 5432)      config.get('db')
reader.get(path, fallback?)      reader.require(path)
reader.has(path)                 reader.all()
```

| | |
| --- | --- |
| block token | `getCooperToken('db')`, for `inject: [...]` and `moduleRef.get(...)` |
| path | `'a.b.c'` or `['dotted.key', 'inner']` |
| values | deep-frozen; bytes in bytes, durations in milliseconds |
| without `@nestjs/config` | `CooperConfig` and the blocks; no `ConfigService` |
| NestJS | 11 (`@nestjs/config` 4) and 12 (`@nestjs/config` 12) |
