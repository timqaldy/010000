import { PRODUCT_CONFIG } from "@/lib/config";
import type { CityEvent } from "@/lib/events";

export type PublicationDecision = {
  eligible: boolean;
  reasons: string[];
};

export function evaluatePublication(event: CityEvent): PublicationDecision {
  const reasons: string[] = [];
  if (event.safety !== "PASS") reasons.push(`safety=${event.safety}`);
  if (event.confidence < PRODUCT_CONFIG.publish.minimumConfidence) reasons.push("confidence below threshold");
  if (event.importance < PRODUCT_CONFIG.publish.minimumImportance) reasons.push("importance below threshold");
  if (event.source_count < 1) reasons.push("missing attribution");
  if (["CONFLICTED", "UNCONFIRMED", "REJECTED", "DETECTED", "VERIFYING"].includes(event.lifecycle)) {
    reasons.push(`lifecycle=${event.lifecycle}`);
  }
  return { eligible: reasons.length === 0, reasons };
}
