/**
 * Shell command runner with environment variable support
 * BUG: Environment variables not passed to shell commands
 */

export interface EnvConfig {
  [key: string]: string;
}

/**
 * Runs a command with custom environment variables
 * BUG: Environment variables are set in parent but not passed to shell
 */
export async function runWithEnv(
  command: string,
  env: EnvConfig
): Promise<string> {
  // BUG: Setting Bun.env doesn't automatically pass to shell subprocess
  for (const [key, value] of Object.entries(env)) {
    Bun.env[key] = value;
  }

  // BUG: Shell doesn't inherit the environment variables we just set
  const result = await Bun.$`${{ raw: command }}`.nothrow();
  return result.stdout.toString();
}

/**
 * Gets a configuration value from environment
 * BUG: Shell $VAR doesn't expand to our custom env
 */
export async function getConfigValue(configName: string): Promise<string> {
  // BUG: Even though we set it, the shell doesn't see it
  Bun.env[configName] = Bun.env[configName] || "default";

  // BUG: $configName won't expand to the variable value in shell
  const result = await Bun.$`echo $${configName}`.nothrow();
  return result.stdout.toString().trim();
}

/**
 * Runs a script with database configuration
 * BUG: DB config vars not available in shell
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
  // BUG: Setting these in Bun.env doesn't pass to subprocess
  Bun.env.DB_HOST = dbConfig.host;
  Bun.env.DB_PORT = String(dbConfig.port);
  Bun.env.DB_USER = dbConfig.user;
  Bun.env.DB_PASSWORD = dbConfig.password;
  Bun.env.DB_NAME = dbConfig.database;

  // BUG: Shell won't see these environment variables
  const result = await Bun.$`bun ${scriptPath}`.nothrow();
  return result.stdout.toString();
}

/**
 * Checks if an environment variable is set in shell
 * BUG: Returns wrong result because env not passed
 */
export async function isEnvSet(varName: string, value: string): Promise<boolean> {
  // BUG: Setting in parent process doesn't propagate
  Bun.env[varName] = value;

  // BUG: This check happens in a subprocess that doesn't see the var
  const result = await Bun.$`test -n "$${varName}"`.nothrow();
  return result.exitCode === 0;
}

/**
 * Runs npm/bun script with custom NODE_ENV
 * BUG: NODE_ENV not passed to npm process
 */
export async function runWithNodeEnv(
  script: string,
  nodeEnv: "development" | "production" | "test"
): Promise<string> {
  // BUG: Setting NODE_ENV here doesn't affect the subprocess
  Bun.env.NODE_ENV = nodeEnv;

  // BUG: npm/bun run won't see NODE_ENV
  const result = await Bun.$`bun run ${script}`.nothrow();
  return result.stdout.toString();
}

/**
 * Gets PATH and custom path entries
 * BUG: Custom PATH entries not visible in shell
 */
export async function runWithCustomPath(
  command: string,
  additionalPaths: string[]
): Promise<string> {
  // BUG: Modifying PATH here doesn't affect subprocess
  const originalPath = Bun.env.PATH || "";
  Bun.env.PATH = [...additionalPaths, originalPath].join(":");

  // BUG: Shell uses its own PATH, not our modified one
  const result = await Bun.$`${{ raw: command }}`.nothrow();
  return result.stdout.toString();
}

/**
 * Runs command with API credentials
 * BUG: Credentials not available in subprocess
 */
export async function runWithApiCredentials(
  command: string,
  credentials: { apiKey: string; apiSecret: string }
): Promise<string> {
  // BUG: Setting credentials in parent doesn't pass to shell
  Bun.env.API_KEY = credentials.apiKey;
  Bun.env.API_SECRET = credentials.apiSecret;

  // BUG: Command won't see API_KEY or API_SECRET
  const result = await Bun.$`${{ raw: command }}`.nothrow();
  return result.stdout.toString();
}

/**
 * Runs multiple commands sharing environment
 * BUG: Environment not shared between commands
 */
export async function runCommandSequence(
  commands: string[],
  sharedEnv: EnvConfig
): Promise<string[]> {
  // BUG: Setting env doesn't persist to subprocesses
  for (const [key, value] of Object.entries(sharedEnv)) {
    Bun.env[key] = value;
  }

  const results: string[] = [];

  for (const cmd of commands) {
    // BUG: Each command runs in fresh shell without our env
    const result = await Bun.$`${{ raw: cmd }}`.nothrow();
    results.push(result.stdout.toString());
  }

  return results;
}

/**
 * Verifies environment is correctly set
 * BUG: Verification fails because env not passed
 */
export async function verifyEnvironment(
  requiredVars: string[]
): Promise<{ valid: boolean; missing: string[] }> {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    // BUG: Check happens in subprocess that doesn't see parent's env
    const result = await Bun.$`printenv ${varName}`.nothrow();
    if (result.exitCode !== 0 || !result.stdout.toString().trim()) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
