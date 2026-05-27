export function createEnv<TConfig extends { runtimeEnv?: Record<string, unknown> }>(
  config: TConfig
) {
  return config.runtimeEnv ?? {};
}
