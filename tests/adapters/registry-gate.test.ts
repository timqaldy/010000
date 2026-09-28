import { describe, expect, it } from "vitest";
import { AdapterError, assertSourceMayIngest } from "@/lib/adapters";

describe("adapter registry gate", () => {
  it("allows an enabled official source", () => {
    expect(() => assertSourceMayIngest("astana-akimat")).not.toThrow();
  });

  it("rejects missing, disabled, and prohibited sources", () => {
    expect(() => assertSourceMayIngest("not-a-source")).toThrow(AdapterError);
    expect(() => assertSourceMayIngest("kazinform")).toThrow(/disabled/);
    expect(() => assertSourceMayIngest("telegram")).toThrow(/PROHIBITED/);
  });
});
