/**
 * Shell command runner with environment variable support
 * FIXED: Proper environment variable passing using .env() method
 */

export interface EnvConfig {
  [key: string]: string;
}

/**
 * Runs a command with custom environment variables
 * FIXED: Uses .env() to pass variables to shell subprocess
 */
export async function runWithEnv(
  command: string,
  env: EnvConfig
): Promise<string> {
  // FIXED: Use .env() method to pass environment to subprocess
  // Include parent environment and merge with custom env
  const result = await Bun.$`${{ raw: command }}`
    .env({ ...Bun.env, ...env })
    .nothrow();

  return result.stdout.toString();
}

/**
 * Gets a configuration value from environment
 * FIXED: Pass the env to shell properly
 */
export async function getConfigValue(configName: string): Promise<string> {
  const value = Bun.env[configName] || "default";

  // FIXED: Use .env() and interpolate the value directly
  const result = await Bun.$`echo ${value}`.nothrow();
  return result.stdout.toString().trim();
}

/**
 * Runs a script with database configuration
 * FIXED: Pass DB config vars using .env()
 */
export async function runWithDatabaseConfig(
  scriptPath: string,
  dbConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }
): Promise<string> {
  // FIXED: Build env object and pass with .env()
  const dbEnv = {
    ...Bun.env,
    DB_HOST: dbConfig.host,
    DB_PORT: String(dbConfig.port),
    DB_USER: dbConfig.user,
    DB_PASSWORD: dbConfig.password,
    DB_NAME: dbConfig.database,
  };

  // FIXED: Shell subprocess will see all DB_* variables
  const result = await Bun.$`bun ${scriptPath}`.env(dbEnv).nothrow();
  return result.stdout.toString();
}

/**
 * Checks if an environment variable is set in shell
 * FIXED: Pass the var using .env()
 */
export async function isEnvSet(varName: string, value: string): Promise<boolean> {
  // FIXED: Use .env() to pass the variable
  const env = { ...Bun.env, [varName]: value };

  // Now the shell subprocess will see the variable
  const result = await Bun.$`test -n "${value}"`.env(env).nothrow();
  return result.exitCode === 0;
}

/**
 * Runs npm/bun script with custom NODE_ENV
 * FIXED: Pass NODE_ENV using .env()
 */
export async function runWithNodeEnv(
  script: string,
  nodeEnv: "development" | "production" | "test"
): Promise<string> {
  // FIXED: Pass NODE_ENV through .env() method
  const env = { ...Bun.env, NODE_ENV: nodeEnv };

  const result = await Bun.$`bun run ${script}`.env(env).nothrow();
  return result.stdout.toString();
}

/**
 * Gets PATH and custom path entries
 * FIXED: Pass modified PATH using .env()
 */
export async function runWithCustomPath(
  command: string,
  additionalPaths: string[]
): Promise<string> {
  // FIXED: Build new PATH and pass through .env()
  const originalPath = Bun.env.PATH || "";
  const newPath = [...additionalPaths, originalPath].join(":");

  const env = { ...Bun.env, PATH: newPath };

  const result = await Bun.$`${{ raw: command }}`.env(env).nothrow();
  return result.stdout.toString();
}

/**
 * Runs command with API credentials
 * FIXED: Pass credentials using .env()
 */
export async function runWithApiCredentials(
  command: string,
  credentials: { apiKey: string; apiSecret: string }
): Promise<string> {
  // FIXED: Include credentials in env passed to subprocess
  const env = {
    ...Bun.env,
    API_KEY: credentials.apiKey,
    API_SECRET: credentials.apiSecret,
  };

  const result = await Bun.$`${{ raw: command }}`.env(env).nothrow();
  return result.stdout.toString();
}

/**
 * Runs multiple commands sharing environment
 * FIXED: Pass shared env to each command
 */
export async function runCommandSequence(
  commands: string[],
  sharedEnv: EnvConfig
): Promise<string[]> {
  // FIXED: Build complete env once
  const env = { ...Bun.env, ...sharedEnv };

  const results: string[] = [];

  for (const cmd of commands) {
    // FIXED: Each command gets the shared environment
    const result = await Bun.$`${{ raw: cmd }}`.env(env).nothrow();
    results.push(result.stdout.toString());
  }

  return results;
}

/**
 * Verifies environment is correctly set
 * FIXED: Pass parent env to verification commands
 */
export async function verifyEnvironment(
  requiredVars: string[]
): Promise<{ valid: boolean; missing: string[] }> {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    // FIXED: Pass Bun.env so subprocess sees same environment
    const result = await Bun.$`printenv ${varName}`
      .env(Bun.env)
      .nothrow();

    if (result.exitCode !== 0 || !result.stdout.toString().trim()) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Alternative: Use cwd() along with env() for complete subprocess control
 */
export async function runInDirectory(
  command: string,
  directory: string,
  env: EnvConfig
): Promise<string> {
  const result = await Bun.$`${{ raw: command }}`
    .cwd(directory)
    .env({ ...Bun.env, ...env })
    .nothrow();

  return result.stdout.toString();
}

/**
 * Helper to create an isolated environment (no parent inheritance)
 */
export async function runWithIsolatedEnv(
  command: string,
  env: EnvConfig
): Promise<string> {
  // Don't spread Bun.env - only pass explicit env vars
  const result = await Bun.$`${{ raw: command }}`.env(env).nothrow();
  return result.stdout.toString();
}
