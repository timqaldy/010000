import type { EventLifecycle } from "./types";

const TRANSITIONS: Record<EventLifecycle, readonly EventLifecycle[]> = {
  DETECTED: ["VERIFYING", "UNCONFIRMED", "REJECTED"],
  VERIFYING: ["CONFIRMED", "UNCONFIRMED", "CONFLICTED", "REJECTED"],
  UNCONFIRMED: ["VERIFYING", "CONFIRMED", "REJECTED", "ARCHIVED"],
  CONFIRMED: ["ACTIVE", "UPDATED", "CONFLICTED", "RESOLVED", "ARCHIVED"],
  ACTIVE: ["UPDATED", "CONFLICTED", "RESOLVED"],
  UPDATED: ["ACTIVE", "UPDATED", "CONFLICTED", "RESOLVED"],
  CONFLICTED: ["VERIFYING", "CONFIRMED", "REJECTED", "ARCHIVED"],
  RESOLVED: ["UPDATED", "ARCHIVED"],
  ARCHIVED: [],
  REJECTED: [],
};

export function canTransitionEvent(from: EventLifecycle, to: EventLifecycle): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertEventTransition(from: EventLifecycle, to: EventLifecycle): void {
  if (!canTransitionEvent(from, to)) {
    throw new Error(`Invalid Event lifecycle transition: ${from} -> ${to}`);
  }
}
