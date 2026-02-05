/**
 * CLI argument parser
 * BUG: Incorrect argv indices cause argument misalignment
 */

export interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, boolean>;
  options: Record<string, string>;
}

/**
 * Parses command-line arguments
 * BUG: Uses wrong indices - argv[0] is bun, not the command
 */
export function parseArgs(argv: string[] = Bun.argv): ParsedArgs {
  // BUG: argv[0] is the bun executable path, not the command!
  // argv[1] is the script path, not the first argument!
  const command = argv[0]; // Wrong! This is "bun" or "/path/to/bun"
  const positional: string[] = [];
  const flags: Record<string, boolean> = {};
  const options: Record<string, string> = {};

  // BUG: Starting at index 1 means we skip argv[0] but include script path
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      // Check if next arg is a value
      if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        options[key] = argv[i + 1];
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
 * BUG: Wrong index means this returns script path
 */
export function getCommand(argv: string[] = Bun.argv): string | undefined {
  // BUG: argv[1] is the script path, not the command!
  return argv[1];
}

/**
 * Gets positional arguments (non-flag arguments)
 * BUG: Includes script path in positional args
 */
export function getPositionalArgs(argv: string[] = Bun.argv): string[] {
  // BUG: Starting at 1 includes the script path
  return argv.slice(1).filter(arg => !arg.startsWith("-"));
}

/**
 * Gets an option value by name
 * BUG: Search starts from wrong index
 */
export function getOption(
  name: string,
  argv: string[] = Bun.argv
): string | undefined {
  // BUG: Should start at index 2, not 0
  const flagIndex = argv.indexOf(`--${name}`);
  if (flagIndex === -1) return undefined;

  const valueIndex = flagIndex + 1;
  if (valueIndex < argv.length && !argv[valueIndex].startsWith("-")) {
    return argv[valueIndex];
  }
  return undefined;
}

/**
 * Checks if a flag is present
 * BUG: May match flags in executable path
 */
export function hasFlag(
  name: string,
  argv: string[] = Bun.argv
): boolean {
  // BUG: Searching from start may match in bun path or script path
  return argv.includes(`--${name}`) || argv.includes(`-${name.charAt(0)}`);
}

/**
 * CLI application class
 * BUG: Constructor parses args incorrectly
 */
export class CLIApp {
  public command: string;
  public args: string[];
  public flags: Set<string>;
  public options: Map<string, string>;

  constructor(argv: string[] = Bun.argv) {
    // BUG: Treating argv[0] as command (it's "bun")
    this.command = argv[0];

    // BUG: Starting from index 1 includes script path
    this.args = [];
    this.flags = new Set();
    this.options = new Map();

    for (let i = 1; i < argv.length; i++) {
      const arg = argv[i];

      if (arg.startsWith("--")) {
        const [key, value] = arg.slice(2).split("=");
        if (value !== undefined) {
          this.options.set(key, value);
        } else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
          this.options.set(key, argv[++i]);
        } else {
          this.flags.add(key);
        }
      } else if (arg.startsWith("-")) {
        // Short flags
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
 * BUG: Dispatches on wrong argument
 */
export function runCLI(argv: string[] = Bun.argv): string {
  // BUG: argv[1] is script path, not command
  const command = argv[1];

  // BUG: argv[2] would be the actual command, but we're using it as first arg
  const arg = argv[2];

  switch (command) {
    case "help":
      return "Usage: cli <command> [options]";
    case "version":
      return "v1.0.0";
    case "greet":
      return `Hello, ${arg || "World"}!`;
    case "add":
      // BUG: Wrong indices for numbers
      const a = parseInt(argv[2]) || 0;
      const b = parseInt(argv[3]) || 0;
      return `Result: ${a + b}`;
    default:
      return `Unknown command: ${command}`;
  }
}

/**
 * Gets script name from argv
 * BUG: Gets wrong part of path
 */
export function getScriptName(argv: string[] = Bun.argv): string {
  // BUG: argv[0] is bun executable, not the script
  const fullPath = argv[0];
  return fullPath.split("/").pop() || "unknown";
}
