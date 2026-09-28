import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runtimeStateSchema } from "./schema";
import type { RuntimeState } from "./types";

export function createEmptyRuntimeState(now = new Date().toISOString()): RuntimeState {
  return {
    version: 1,
    pipeline_version: 2,
    updated_at: now,
    raw_items: [],
    event_records: [],
    extraction_runs: [],
    collection_runs: [],
  };
}

export class JsonRuntimeStore {
  private writeChain: Promise<void> = Promise.resolve();

  constructor(
    readonly filePath = process.env.RUNTIME_STATE_PATH
      ? path.resolve(process.env.RUNTIME_STATE_PATH)
      : path.join(process.cwd(), "data", "runtime-state.json"),
  ) {}

  async read(): Promise<RuntimeState> {
    try {
      const data: unknown = JSON.parse(await readFile(this.filePath, "utf8"));
      return runtimeStateSchema.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return createEmptyRuntimeState();
      throw error;
    }
  }

  async write(state: RuntimeState): Promise<void> {
    const validated = runtimeStateSchema.parse(state);
    this.writeChain = this.writeChain.then(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
    });
    return this.writeChain;
  }
}

export const runtimeStore = new JsonRuntimeStore();
