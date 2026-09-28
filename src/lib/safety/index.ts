import type { EventSource, SafetyOutcome } from "@/lib/events";
import type { EventCandidate } from "@/lib/extraction";
import type { SourceRecord } from "@/lib/sources";

export type SafetyDecision = {
  outcome: SafetyOutcome;
  reasons: string[];
};

const PRIVATE_CONTACT = /(?:\+?7|8)[\s()-]*\d{3}[\s()-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/;
const SENSATIONAL = /шок|ужас|катастрофа века|срочно!!!/i;

export function evaluateSafety(input: {
  candidate: EventCandidate;
  evidence: readonly EventSource[];
  registry: readonly SourceRecord[];
}): SafetyDecision {
  const reasons: string[] = [];
  if (input.candidate.claims.length === 0 || input.evidence.length === 0) reasons.push("missing evidence");
  for (const evidence of input.evidence) {
    const source = input.registry.find((item) => item.source_id === evidence.source_id);
    if (!source || !source.enabled || source.reuse_status === "PROHIBITED" || source.reuse_status === "REVIEW_REQUIRED") {
      reasons.push(`source ${evidence.source_id} is not eligible`);
    }
  }
  if (input.evidence.some((item) => item.role === "CONTRADICTING")) reasons.push("blocking contradiction");
  if (reasons.length > 0) return { outcome: "FAIL", reasons };

  const text = `${input.candidate.title} ${input.candidate.summary}`;
  if (PRIVATE_CONTACT.test(text)) return { outcome: "REVIEW", reasons: ["possible private contact details"] };
  if (SENSATIONAL.test(text)) return { outcome: "REVIEW", reasons: ["sensational language"] };
  return { outcome: "PASS", reasons: ["claims have eligible attribution and no automatic safety flag"] };
}
