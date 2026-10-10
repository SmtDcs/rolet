import { C, F } from "./theme";

export function WorkshopNote() {
  return (
    <section className="px-5 py-24" style={{ background: "rgba(20,20,20,0.96)" }}>
      <div className="mx-auto max-w-2xl">
        <hr className="mb-8 border-0" style={{ height: 2, background: C.wood }} />
        <p className="text-lg leading-relaxed" style={{ fontFamily: F.sans, color: C.bone }}>
          Two players, one bench, one lamp. Both of you lock in a secret before the cylinder is loaded,
          so nobody &mdash; not even the host &mdash; knows where the live rounds sit.
        </p>
        <p className="mt-4 text-sm" style={{ fontFamily: F.mono, color: C.worn }}>
          Four lives each. First to zero loses the stake.
        </p>
      </div>
    </section>
  );
}
