/**
 * CLI argument parser
 * FIXED: Correct argv indices (user args start at index 2)
 */

export interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, boolean>;
  options: Record<string, string>;
}

/**
 * Parses command-line arguments
 * FIXED: argv[0] is bun, argv[1] is script, user args start at argv[2]
 */
export function parseArgs(argv: string[] = Bun.argv): ParsedArgs {
  // FIXED: Get user arguments starting from index 2
  const userArgs = argv.slice(2);

  // FIXED: First user argument is the command
  const command = userArgs[0] || "";
  const positional: string[] = [];
  const flags: Record<string, boolean> = {};
  const options: Record<string, string> = {};

  // FIXED: Parse all user arguments (starting from index 0 of userArgs)
  for (let i = 0; i < userArgs.length; i++) {
    const arg = userArgs[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      // Check if next arg is a value
      if (i + 1 < userArgs.length && !userArgs[i + 1].startsWith("-")) {
        options[key] = userArgs[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      flags[key] = true;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags, options };
}

/**
 * Gets the command (first positional argument after script)
 * FIXED: Returns argv[2], the first user argument
 */
export function getCommand(argv: string[] = Bun.argv): string | undefined {
  // FIXED: User arguments start at index 2
  return argv[2];
}

/**
 * Gets positional arguments (non-flag arguments)
 * FIXED: Starts from index 2 to skip bun and script path
 */
export function getPositionalArgs(argv: string[] = Bun.argv): string[] {
  // FIXED: Start at index 2 for user arguments
  return argv.slice(2).filter(arg => !arg.startsWith("-"));
}

/**
 * Gets an option value by name
 * FIXED: Only searches in user arguments (index 2+)
 */
export function getOption(
  name: string,
  argv: string[] = Bun.argv
): string | undefined {
  // FIXED: Only search in user args
  const userArgs = argv.slice(2);
  const flagIndex = userArgs.indexOf(`--${name}`);
  if (flagIndex === -1) return undefined;

  const valueIndex = flagIndex + 1;
  if (valueIndex < userArgs.length && !userArgs[valueIndex].startsWith("-")) {
    return userArgs[valueIndex];
  }
  return undefined;
}

/**
 * Checks if a flag is present
 * FIXED: Only checks user arguments
 */
export function hasFlag(
  name: string,
  argv: string[] = Bun.argv
): boolean {
  // FIXED: Only search in user arguments (index 2+)
  const userArgs = argv.slice(2);
  return userArgs.includes(`--${name}`) || userArgs.includes(`-${name.charAt(0)}`);
}

/**
 * CLI application class
 * FIXED: Correctly parses from index 2
 */
export class CLIApp {
  public command: string;
  public args: string[];
  public flags: Set<string>;
  public options: Map<string, string>;

  constructor(argv: string[] = Bun.argv) {
    // FIXED: Get user arguments starting from index 2
    const userArgs = argv.slice(2);

    // FIXED: First user arg is command
    this.command = userArgs[0] || "";

    this.args = [];
    this.flags = new Set();
    this.options = new Map();

    // FIXED: Parse user arguments only
    for (let i = 0; i < userArgs.length; i++) {
      const arg = userArgs[i];

      if (arg.startsWith("--")) {
        const [key, value] = arg.slice(2).split("=");
        if (value !== undefined) {
          this.options.set(key, value);
        } else if (i + 1 < userArgs.length && !userArgs[i + 1].startsWith("-")) {
          this.options.set(key, userArgs[++i]);
        } else {
          this.flags.add(key);
        }
      } else if (arg.startsWith("-") && arg.length > 1) {
        // Short flags - handle combined flags like -vdf
        for (const char of arg.slice(1)) {
          this.flags.add(char);
        }
      } else {
        this.args.push(arg);
      }
    }
  }

  hasFlag(name: string): boolean {
    return this.flags.has(name) || this.flags.has(name.charAt(0));
  }

  getOption(name: string, defaultValue?: string): string | undefined {
    return this.options.get(name) ?? defaultValue;
  }

  getArg(index: number): string | undefined {
    return this.args[index];
  }
}

/**
 * Simple command runner
 * FIXED: Uses correct indices
 */
export function runCLI(argv: string[] = Bun.argv): string {
  // FIXED: Command is at index 2 (first user argument)
  const command = argv[2];

  // FIXED: Additional args start at index 3
  const arg = argv[3];

  switch (command) {
    case "help":
      return "Usage: cli <command> [options]";
    case "version":
      return "v1.0.0";
    case "greet":
      return `Hello, ${arg || "World"}!`;
    case "add":
      // FIXED: Numbers at correct indices
      const a = parseInt(argv[3]) || 0;
      const b = parseInt(argv[4]) || 0;
      return `Result: ${a + b}`;
    default:
      return `Unknown command: ${command}`;
  }
}

/**
 * Gets script name from argv
 * FIXED: Gets script path from argv[1]
 */
export function getScriptName(argv: string[] = Bun.argv): string {
  // FIXED: Script path is at argv[1], not argv[0]
  const fullPath = argv[1];
  return fullPath?.split("/").pop() || "unknown";
}

/**
 * Alternative: Use process.argv (same structure as Bun.argv)
 */
export function parseArgsProcess(): ParsedArgs {
  return parseArgs(process.argv);
}

/**
 * Helper to get all user arguments as array
 */
export function getUserArgs(argv: string[] = Bun.argv): string[] {
  return argv.slice(2);
}

/**
 * Helper to get bun executable path
 */
export function getBunPath(argv: string[] = Bun.argv): string {
  return argv[0];
}

/**
 * Helper to get script path
 */
export function getScriptPath(argv: string[] = Bun.argv): string {
  return argv[1];
}
