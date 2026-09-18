"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GUIDE_STEPS, GUIDE_TIPS, type GuideStep } from "@/lib/guideSteps";

// localStorage key — tur otomatis hanya sekali per pengguna/perangkat
const SEEN_KEY = "sipetak_guide_seen_v1";

type Rect = { top: number; left: number; width: number; height: number };

function getRect(sel: string): Rect | null {
  const el = document.querySelector(sel) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// posisi kartu pop-up relatif ke elemen tersorot
function cardPos(rect: Rect, place: GuideStep["place"], cardW = 300, cardH = 150) {
  const gap = 12;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = 0, left = 0, arrow = place ?? "bottom";

  const tryPlace = (p: string) => {
    switch (p) {
      case "right": return { top: rect.top + rect.height / 2 - cardH / 2, left: rect.left + rect.width + gap, ok: rect.left + rect.width + gap + cardW < vw };
      case "left": return { top: rect.top + rect.height / 2 - cardH / 2, left: rect.left - cardW - gap, ok: rect.left - cardW - gap > 0 };
      case "top": return { top: rect.top - cardH - gap, left: rect.left + rect.width / 2 - cardW / 2, ok: rect.top - cardH - gap > 0 };
      default: return { top: rect.top + rect.height + gap, left: rect.left + rect.width / 2 - cardW / 2, ok: rect.top + rect.height + gap + cardH < vh };
    }
  };

  const order = [place ?? "bottom", "bottom", "top", "right", "left"];
  for (const p of order) {
    const r = tryPlace(p);
    if (r.ok) { top = r.top; left = r.left; arrow = p as any; break; }
    top = r.top; left = r.left; arrow = p as any;
  }
  // jaga tetap di dalam layar
  left = Math.max(8, Math.min(left, vw - cardW - 8));
  top = Math.max(8, Math.min(top, vh - cardH - 8));
  return { top, left, arrow };
}

/* ============================================================
   TUR BERTAHAP (spotlight + next/prev)
   ============================================================ */
export function GuidedTour({
  open,
  onClose,
  steps = GUIDE_STEPS,
}: {
  open: boolean;
  onClose: () => void;
  steps?: GuideStep[];
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [, force] = useState(0);

  const step = steps[i];

  // hitung ulang posisi elemen (dan lewati elemen yang tak ada di layar)
  useLayoutEffect(() => {
    if (!open) return;
    let idx = i;
    let r = getRect(steps[idx]?.selector ?? "");
    // kalau elemen langkah ini tidak ada (mis. fitur tersembunyi utk peran ini), lompat
    let guard = 0;
    while (!r && idx < steps.length - 1 && guard < steps.length) {
      idx++; guard++;
      r = getRect(steps[idx]?.selector ?? "");
    }
    if (idx !== i) { setI(idx); return; }
    setRect(r);
  }, [i, open, steps]);

  // reposisi saat resize / scroll
  useEffect(() => {
    if (!open) return;
    const on = () => { setRect(getRect(steps[i]?.selector ?? "")); force((n) => n + 1); };
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("scroll", on, true); };
  }, [i, open, steps]);

  // keyboard: Esc tutup, panah navigasi
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, i]); // eslint-disable-line

  if (!open || !step) return null;

  const finish = () => {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
    setI(0);
    onClose();
  };
  const next = () => (i < steps.length - 1 ? setI(i + 1) : finish());
  const prev = () => setI(Math.max(0, i - 1));

  const pad = 6;
  const hole = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;
  const pos = rect ? cardPos(rect, step.place) : { top: window.innerHeight / 2 - 75, left: window.innerWidth / 2 - 150, arrow: "bottom" as const };

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* overlay gelap dengan "lubang" spotlight (pakai box-shadow besar) */}
      {hole ? (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{
            top: hole.top, left: hole.left, width: hole.width, height: hole.height,
            boxShadow: "0 0 0 9999px rgba(6,14,22,0.72)",
            border: "2px solid #2FA6A0",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "rgba(6,14,22,0.72)" }} />
      )}

      {/* klik area gelap untuk melewati */}
      <button className="absolute inset-0 cursor-default" aria-label="Lewati" onClick={finish} />

      {/* kartu penjelasan */}
      <div
        className="absolute w-[300px] rounded-2xl border border-[#22394A] bg-[#101F2C] p-4 text-[#E7EFF3] shadow-[0_18px_50px_rgba(0,0,0,.55)]"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-[1.2px] text-[#2FA6A0]">
            Langkah {i + 1} / {steps.length}
          </span>
          <button onClick={finish} className="rounded px-1.5 text-[15px] leading-none text-[#8FA6B4] hover:text-white" aria-label="Tutup">×</button>
        </div>
        <h3 className="font-bold text-[15px]">{step.title}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#B7C6D0]">{step.body}</p>

        {/* progress dots */}
        <div className="mt-3 flex items-center justify-center gap-1">
          {steps.map((_, n) => (
            <span key={n} className={`h-[5px] rounded-full transition-all ${n === i ? "w-4 bg-[#2FA6A0]" : "w-[5px] bg-[#2f4657]"}`} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button onClick={finish} className="text-[12px] text-[#8FA6B4] hover:text-white">Lewati</button>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={prev} className="rounded-lg border border-[#22394A] px-3 py-1.5 text-[12px] font-semibold text-[#B7C6D0] hover:text-white">
                Kembali
              </button>
            )}
            <button onClick={next} className="rounded-lg bg-[#2FA6A0] px-3.5 py-1.5 text-[12px] font-bold text-[#04171a] hover:brightness-110">
              {i < steps.length - 1 ? "Lanjut" : "Selesai"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   POP-UP KECIL PER FITUR (ikon i / hover)
   Pakai: <HelpDot id="terrain" />  di sebelah judul fitur
   ============================================================ */
export function HelpDot({ id, className = "" }: { id: string; className?: string }) {
  const tip = GUIDE_TIPS[id];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  if (!tip) return null;

  return (
    <span
      ref={ref}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Bantuan: ${tip.title}`}
        className="grid h-[15px] w-[15px] place-items-center rounded-full border border-[#3a5568] text-[9px] font-bold text-[#8FA6B4] hover:border-[#2FA6A0] hover:text-[#2FA6A0]"
      >
        i
      </button>
      {open && (
        <span className="absolute left-1/2 top-[22px] z-[9998] w-[220px] -translate-x-1/2 rounded-lg border border-[#22394A] bg-[#101F2C] p-2.5 text-left shadow-[0_12px_30px_rgba(0,0,0,.5)]">
          <span className="block text-[11.5px] font-bold text-[#2FA6A0]">{tip.title}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-[#B7C6D0]">{tip.body}</span>
        </span>
      )}
    </span>
  );
}

/* ============================================================
   PEMBUNGKUS: auto-buka sekali + tombol Bantuan (?)
   Taruh <GuideRoot /> sekali di halaman peta.
   ============================================================ */
export default function GuideRoot() {
  const [open, setOpen] = useState(false);

  // buka otomatis saat pertama kali (belum pernah dilihat)
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch {}
    if (!seen) {
      // tunggu sedikit agar elemen peta & sidebar sudah ter-render
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      {/* Tombol Bantuan mengambang — buka tur kapan saja */}
      <button
        onClick={() => setOpen(true)}
        data-guide="bantuan"
        aria-label="Bantuan / Panduan"
        className="fixed bottom-4 right-4 z-[9990] grid h-11 w-11 place-items-center rounded-full border border-[#22394A] bg-[#101F2C] text-[18px] font-bold text-[#2FA6A0] shadow-[0_8px_25px_rgba(0,0,0,.4)] hover:brightness-110"
        title="Panduan penggunaan"
      >
        ?
      </button>

      <GuidedTour open={open} onClose={() => setOpen(false)} />
    </>
  );
}
