import { AstanaRekAdapter } from "../adapters/astana-rek/adapter";
import { CtsAdapter } from "../adapters/cts/adapter";
import { AdapterError } from "../adapters/errors";
import { AstanaAkimatAdapter } from "../adapters/gov-kz/astana-akimat";
import { AstanaDchsAdapter, AstanaTransportAdapter } from "../adapters/gov-kz/entity";
import { assertSourceMayIngest } from "../adapters/registry-gate";
import type { SourceAdapter } from "../adapters/types";

const adapters: Record<string, () => SourceAdapter> = {
  "astana-akimat": () => new AstanaAkimatAdapter(),
  "astana-dchs": () => new AstanaDchsAdapter(),
  "astana-transport": () => new AstanaTransportAdapter(),
  cts: () => new CtsAdapter(),
  "astana-rek": () => new AstanaRekAdapter(),
};

export function createAdapter(sourceId: string): SourceAdapter {
  assertSourceMayIngest(sourceId);
  const factory = adapters[sourceId];
  if (!factory) {
    throw new AdapterError(`No adapter registered for source ${sourceId}`);
  }
  return factory();
}
