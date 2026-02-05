// Application source code
export interface AppConfig {
  name: string;
  version: string;
  debug: boolean;
}

export class Application {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  start() {
    console.log(`Starting ${this.config.name} v${this.config.version}`);
    if (this.config.debug) {
      console.log("Debug mode enabled");
    }
    return { status: "started", config: this.config };
  }

  stop() {
    console.log(`Stopping ${this.config.name}`);
    return { status: "stopped" };
  }

  getConfig() {
    return { ...this.config };
  }
}

export function createApp(name: string, version: string = "1.0.0"): Application {
  return new Application({
    name,
    version,
    debug: process.env.DEBUG === "true",
  });
}

// Default export
const defaultApp = createApp("DefaultApp");
export default defaultApp;
