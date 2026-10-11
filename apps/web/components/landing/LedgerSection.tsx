"use client";

import { useEffect, useState } from "react";

type Stats = {
  characters: number | null;
  lobbies: number | null;
  treasurySol: number | null;
};

const FALLBACK: Stats = { characters: null, lobbies: null, treasurySol: null };

function Value({ value }: { value: string | null }) {
  if (value === null) return <span className="text-[var(--color-phosphor-faint)]">--</span>;
  return <span>{value}</span>;
}

export function LedgerSection() {
  const [stats, setStats] = useState<Stats>(FALLBACK);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d: Stats) => {
        if (alive) setStats(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const cells = [
    {
      label: "Characters minted",
      value: stats.characters === null ? null : stats.characters.toLocaleString("en-US"),
      note: "Metaplex Core assets on devnet",
    },
    {
      label: "Benches opened",
      value: stats.lobbies === null ? null : stats.lobbies.toLocaleString("en-US"),
      note: "Lobby accounts on chain",
    },
    {
      label: "Treasury",
      value: stats.treasurySol === null ? null : `${stats.treasurySol.toFixed(3)} SOL`,
      note: "Program-owned reward pool",
    },
    {
      label: "Reward per match",
      value: "0.02 SOL",
      note: "Fixed, paid from the treasury",
    },
  ];

  return (
    <section id="ledger" className="grid-field grain-field scroll-mt-14 border-t border-[var(--color-line)] bg-[var(--color-void)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="frame" data-frame="THE LEDGER">
          <p className="label">Read from the chain, not from a dashboard</p>
          <h2 className="macro-sm mt-3">What ROLET is</h2>
          <p className="mt-4 max-w-2xl font-sans text-[0.95rem] leading-relaxed text-[var(--color-phosphor-dim)]">
            Two players, one revolver, eight chambers. The match lives on Solana and
            its turns run on an ephemeral rollup. Nothing here is simulated: the
            counters below are read from the program account.
          </p>
        </div>

        {/* Grid gap with a contrasting parent background yields hairline rules. */}
        <div className="mt-10 grid grid-cols-2 gap-px bg-[var(--color-line)] lg:grid-cols-4">
          {cells.map((c) => (
            <div key={c.label} className="bg-[var(--color-void)] px-5 py-7">
              <p className="label">{c.label}</p>
              <p className="readout mt-3 text-2xl lg:text-3xl">
                <Value value={c.value} />
              </p>
              <p className="mt-2 font-sans text-[0.75rem] leading-snug text-[var(--color-phosphor-faint)]">
                {c.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
