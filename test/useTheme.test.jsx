// Quick smoke test: confirm the dev-mode warning fires when useTheme
// is called without a provider, and that it does NOT fire when wrapped.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import { useTheme, ThemeProvider } from "@/utils/useTheme";

function Probe() {
  const t = useTheme();
  return <div data-mounted={String(t.mounted)} data-default={String(t._isDefault === true)} />;
}

describe("useTheme dev-mode warning", () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns when called outside a ThemeProvider", async () => {
    render(<Probe />);
    // The warn is deferred to a microtask.
    await Promise.resolve();
    await Promise.resolve();
    const messages = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes("[useTheme] called outside <ThemeProvider>"))).toBe(true);
  });

  it("does NOT warn when called inside a ThemeProvider", async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await Promise.resolve();
    await Promise.resolve();
    const messages = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes("[useTheme] called outside <ThemeProvider>"))).toBe(false);
  });

  it("warns at most once per component instance across renders", async () => {
    let setTick;
    function Wrapper() {
      const [n, setN] = React.useState(0);
      setTick = setN;
      const t = useTheme();
      return <div data-n={n} data-mounted={String(t.mounted)} />;
    }
    render(<Wrapper />);
    // trigger several re-renders, wrapped in act() so React state
    // updates don't leak out of the test.
    act(() => {
      setTick(1);
      setTick(2);
      setTick(3);
    });
    await Promise.resolve();
    await Promise.resolve();
    const matches = warnSpy.mock.calls.filter((c) =>
      String(c[0]).includes("[useTheme] called outside <ThemeProvider>")
    );
    expect(matches.length).toBeLessThanOrEqual(1);
  });
});
