"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps the match playable when the room cannot be drawn.
 *
 * The board is a WebGL canvas, and a WebGL context can be lost for reasons
 * that have nothing to do with this app: a driver reset, a GPU process that
 * dies under memory pressure, a machine that only exposes a shared adapter.
 * When that happens React unmounts the tree from the root up and the player
 * is left staring at "This page couldn't load" mid-match.
 *
 * Catching it here degrades the room to its own dark ground instead. The
 * interface, the turns and the chain calls are all unaffected — only the
 * picture is missing.
 */
export class SceneBoundary extends Component<
  { children: ReactNode; ground?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[rolet] the room could not be drawn:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-[#050404]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 55%, #14100c 0%, #050404 70%)",
          }}
        >
          {this.props.ground}
        </div>
      );
    }
    return this.props.children;
  }
}
