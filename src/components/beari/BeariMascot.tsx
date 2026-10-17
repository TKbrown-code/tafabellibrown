import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

export type BeariState =
  | "idle" | "welcome" | "curious" | "listening" | "thinking"
  | "happy" | "speaking" | "confused" | "apologetic" | "sleeping";

export interface BeariHandle {
  /** Small spring bounce; pass true to add an ear wiggle. */
  bounce: (wiggle?: boolean) => void;
}

export interface BeariMascotProps {
  state?: BeariState;
  size?: number | string;
  /** Where the eyes look, each axis -1..1. Used in idle-hover, curious and listening. */
  gaze?: { x: number; y: number } | null;
  /** When true and state is "idle", the bear switches to "curious". */
  hovered?: boolean;
  /** false = render a still pose (no rAF loop). */
  animate?: boolean;
  /** Accessible name. Pass "" when the bear is decorative. */
  title?: string;
  className?: string;
}

type Pose = {
  rot: number; x: number; y: number; sc: number; lx: number; ly: number; eo: number;
  hap: number; slp: number; bLy: number; bLr: number; bRy: number; bRr: number;
  w: number; lift: number; d: number; skew: number; open: number; chk: number;
  eL: number; eR: number; z: number;
};

const BASE: Pose = {
  rot: 0, x: 0, y: 0, sc: 1, lx: 0, ly: 0, eo: 1, hap: 0, slp: 0,
  bLy: 0, bLr: 0, bRy: 0, bRr: 0, w: 24, lift: 7, d: 9, skew: 0, open: 0,
  chk: 0.18, eL: 0, eR: 0, z: 0,
};

/** Edit this table to retune an expression. */
export const POSES: Record<BeariState, Partial<Pose>> = {
  idle: {},
  welcome: { w: 27, lift: 11, d: 12, bLy: -3, bRy: -3, chk: 0.4 },
  curious: { rot: -6, lx: 4, ly: 1, bLy: -4, bRy: -5, bLr: -3, bRr: 3, w: 22, lift: 6, chk: 0.25, eL: -5, eR: 6 },
  listening: { y: 2, sc: 1.03, eo: 1.1, ly: 1, bLy: -3, bRy: -3, w: 17, lift: 3, d: 5, chk: 0.2 },
  thinking: { rot: 5, lx: -5, ly: -4, eo: 0.92, bLy: 1, bLr: 6, bRy: -6, bRr: -6, w: 11, lift: 0, d: 2, skew: 1 },
  happy: { rot: -3, hap: 1, bLy: -3, bRy: -3, w: 30, lift: 12, d: 14, open: 0.4, chk: 0.5, eL: -5, eR: 5 },
  speaking: { w: 20, lift: 4, d: 6, open: 0.6, bLy: -1, bRy: -1 },
  confused: { rot: 9, lx: 4, ly: -1, eo: 0.95, bLy: -8, bLr: -8, bRy: 2, bRr: 7, w: 13, lift: 0, d: 2, skew: 3 },
  apologetic: { rot: -3, y: 3, ly: 2, eo: 0.85, bLy: 2, bLr: -13, bRy: 2, bRr: 13, w: 14, lift: -4, d: -7, chk: 0 },
  sleeping: { rot: 6, y: 4, slp: 1, bLy: 3, bRy: 3, w: 14, lift: 4, d: 5, z: 1, chk: 0.3 },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const HEAD = "#1D3D9B", RIM = "#6F9AF8", CREAM = "#FAF9F6", INK = "#141B28";

export const BeariMascot = forwardRef<BeariHandle, BeariMascotProps>(function BeariMascot(
  { state = "idle", size = 64, gaze = null, hovered = false, animate = true, title = "Beari", className },
  ref,
) {
  const root = useRef<SVGSVGElement>(null);
  const live = useRef({ state, gaze, hovered });
  live.current = { state, gaze, hovered };
  const reduced = useRef(false);
  const frameRef = useRef<(dt: number) => void>(() => {});
  const eng = useRef({
    cur: { ...BASE } as Pose, first: true, t: Math.random() * 10, nb: 0, bp: -1,
    ng: 2, jx: 0, jy: 0, by: 0, bv: 0, wig: 0,
  });

  const bounce = useCallback((wiggle = false) => {
    if (reduced.current) return;
    eng.current.bv = -85;
    eng.current.wig = wiggle ? 1 : 0;
  }, []);
  useImperativeHandle(ref, () => ({ bounce }), [bounce]);

  // Engine: mutates SVG attributes directly so React never re-renders per frame.
  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const q: Record<string, SVGElement> = {};
    svg.querySelectorAll<SVGElement>("[data-r]").forEach((el) => { q[el.dataset.r as string] = el; });
    const A = (k: string, n: string, v: string | number) => q[k].setAttribute(n, String(v));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => { reduced.current = mq.matches; };
    onMq();
    mq.addEventListener("change", onMq);
    const e = eng.current;
    e.nb = e.t + 2 + Math.random() * 3;

    const frame = (dt: number) => {
      const p = live.current;
      const rm = reduced.current || !animate;
      const eff: BeariState = p.hovered && p.state === "idle" ? "curious" : p.state;
      const T: Pose = { ...BASE, ...POSES[eff] };
      if (p.gaze && (eff === "curious" || eff === "listening")) {
        T.lx = p.gaze.x * 5.5; T.ly = p.gaze.y * 3.5;
      }
      if (e.first) { e.cur = { ...T }; e.first = false; }
      e.t += dt;
      const t = e.t, c = e.cur;
      const k = rm ? 1 : 1 - Math.exp(-dt * 9);
      (Object.keys(T) as (keyof Pose)[]).forEach((key) => { c[key] += (T[key] - c[key]) * k; });

      let y = c.y, rot = c.rot, lx = c.lx, ly = c.ly, open = c.open, bl = 1;
      const sleepy = c.slp > 0.5;
      if (!rm) {
        y += Math.sin(t * (sleepy ? 1 : 1.7)) * (sleepy ? 1.8 : 1);
        e.bv += (-260 * e.by - 14 * e.bv) * dt; e.by += e.bv * dt; y += e.by;
        if ((p.state === "idle" && !p.hovered) || p.state === "welcome") {
          if (t > e.ng) { e.jx = (Math.random() - 0.5) * 5; e.jy = (Math.random() - 0.6) * 3; e.ng = t + 2 + Math.random() * 3; }
          lx += e.jx; ly += e.jy;
        }
        if (p.state === "speaking") {
          open = T.open * (0.25 + 0.75 * Math.abs(Math.sin(t * 7.3) * 0.6 + Math.sin(t * 11.7 + 1) * 0.4));
          rot += Math.sin(t * 2.2) * 1.4; y += Math.sin(t * 4.4) * 0.8;
        }
        if (p.state === "thinking") { rot += Math.sin(t * 1.4) * 1.2; lx += Math.sin(t * 1.1) * 1.5; }
        if (e.bp < 0 && t > e.nb) e.bp = 0;
        if (e.bp >= 0) {
          e.bp += dt / 0.17; bl = 1 - Math.sin(Math.PI * Math.min(1, e.bp));
          if (e.bp >= 1) { e.bp = -1; e.nb = t + 2.2 + Math.random() * 3.8; if (Math.random() < 0.2) e.nb = t + 0.35; }
        }
      } else if (p.state === "speaking") open = T.open * 0.5;

      const wg = Math.sin(t * 20) * e.wig * 7;
      e.wig *= Math.exp(-dt * 3);
      A("rig", "transform", `translate(${c.x} ${y}) rotate(${rot} 120 200) translate(120 150) scale(${c.sc}) translate(-120 -150)`);
      A("eL", "transform", `rotate(${c.eL + wg} 50 84)`);
      A("eR", "transform", `rotate(${c.eR - wg} 190 84)`);
      A("bL", "transform", `translate(0 ${c.bLy}) rotate(${c.bLr} 86 88)`);
      A("bR", "transform", `translate(0 ${c.bRy}) rotate(${c.bRr} 154 88)`);
      const es = Math.max(0.06, c.eo * bl), eop = 1 - Math.max(c.hap, c.slp);
      for (const [s, cx] of [["L", 86], ["R", 154]] as const) {
        A("y" + s, "transform", `translate(${cx} 112) scale(1 ${es}) translate(${-cx} -112)`);
        A("y" + s, "opacity", eop);
        A("p" + s, "transform", `translate(${clamp(lx, -6, 6)} ${clamp(ly, -4, 4)})`);
        A("h" + s, "opacity", c.hap); A("s" + s, "opacity", c.slp);
      }
      A("chk", "opacity", c.chk);
      const W = c.w, yL = 178 - c.lift, yR = yL - c.skew;
      const smile = `M${120 - W} ${yL}Q${120 - W * 0.5} ${178 + c.d} 120 178Q${120 + W * 0.5} ${178 + c.d} ${120 + W} ${yR}`;
      A("sm", "d", smile);
      A("mo", "d", `${smile}Q120 ${178 + open * 34 + Math.max(0, c.d) * 0.5} ${120 - W} ${yL}Z`);
      A("mo", "fill-opacity", Math.min(1, open * 8));
      A("tg", "cx", 120); A("tg", "cy", 180 + open * 9.5); A("tg", "rx", W * 0.4); A("tg", "ry", open * 3);
      A("tg", "opacity", open > 0.25 ? 1 : 0);
      A("z", "opacity", c.z > 0.01 ? 1 : 0);
      if (c.z > 0.01) {
        ([["z1", 0], ["z2", 0.5]] as const).forEach(([id, o]) => {
          const ph = (t * 0.35 + o) % 1;
          A(id, "transform", `translate(${204 + ph * 14} ${34 - ph * 22}) scale(${0.7 + ph * 0.6})`);
          A(id, "opacity", Math.sin(Math.PI * ph) * c.z);
        });
      }
    };
    frameRef.current = frame;
    frame(0);

    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!document.hidden) frame(dt);
      raf = requestAnimationFrame(loop);
    };
    if (animate) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); mq.removeEventListener("change", onMq); };
  }, [animate]);

  // Still copies repaint when props change.
  useEffect(() => { if (!animate) frameRef.current(0); }, [animate, state, hovered, gaze]);

  // One-shot bounce on welcoming / success.
  useEffect(() => {
    if (animate && (state === "happy" || state === "welcome")) bounce(state === "happy");
  }, [state, animate, bounce]);

  const decorative = title === "";
  return (
    <svg
      ref={root} className={className} viewBox="0 0 240 240" width={size} height={size}
      role={decorative ? undefined : "img"} aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined} focusable="false" style={{ display: "block", overflow: "visible" }}
    >
      <g data-r="rig">
        <g data-r="eL">
          <circle cx="50" cy="62" r="30" fill={HEAD} stroke={RIM} strokeOpacity=".5" strokeWidth="2.5" />
          <circle cx="53" cy="66" r="17" fill={CREAM} />
        </g>
        <g data-r="eR">
          <circle cx="190" cy="62" r="30" fill={HEAD} stroke={RIM} strokeOpacity=".5" strokeWidth="2.5" />
          <circle cx="187" cy="66" r="17" fill={CREAM} />
        </g>
        <path d="M120 44C150 44 172 52 188 66C206 82 214 106 216 128C217 170 190 210 120 214C50 210 23 170 24 128C26 106 34 82 52 66C68 52 90 44 120 44Z" fill={HEAD} stroke={RIM} strokeOpacity=".5" strokeWidth="2.5" />
        <path d="M110 47C114 36 122 31 134 31C130 37 128 42 129 47Z M24 136L13 154L30 150Z M216 136L227 154L210 150Z" fill={HEAD} />
        <g data-r="chk" fill={RIM}><ellipse cx="58" cy="148" rx="11" ry="6.5" /><ellipse cx="182" cy="148" rx="11" ry="6.5" /></g>
        <path d="M120 140C146 140 170 156 172 178C172 198 148 205 120 205C92 205 68 198 68 178C70 156 94 140 120 140Z" fill={CREAM} />
        <path d="M104 151C104 143 112 140 120 140C128 140 136 143 136 151C136 158 128 162 120 168C112 162 104 158 104 151Z" fill={INK} />
        <ellipse cx="114" cy="147" rx="7" ry="2.4" fill={CREAM} opacity=".75" transform="rotate(-10 114 147)" />
        <path data-r="mo" fill={INK} fillOpacity="0" />
        <ellipse data-r="tg" fill={RIM} opacity="0" />
        <path data-r="sm" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 167V178" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <g data-r="yL"><ellipse cx="86" cy="112" rx="17" ry="15" fill={CREAM} /><g data-r="pL"><circle cx="86" cy="112" r="9.5" fill={INK} /><circle cx="89" cy="108.5" r="3" fill="#fff" /></g></g>
        <g data-r="yR"><ellipse cx="154" cy="112" rx="17" ry="15" fill={CREAM} /><g data-r="pR"><circle cx="154" cy="112" r="9.5" fill={INK} /><circle cx="157" cy="108.5" r="3" fill="#fff" /></g></g>
        <g fill="none" stroke={CREAM} strokeWidth="5.5" strokeLinecap="round">
          <path data-r="hL" d="M70 117Q86 101 102 117" opacity="0" />
          <path data-r="hR" d="M138 117Q154 101 170 117" opacity="0" />
          <path data-r="sL" d="M70 111Q86 124 102 111" opacity="0" />
          <path data-r="sR" d="M138 111Q154 124 170 111" opacity="0" />
        </g>
        <path data-r="bL" d="M68 94Q84 76 103 86Q86 82 68 94Z" fill={CREAM} stroke={CREAM} strokeWidth="2" strokeLinejoin="round" />
        <path data-r="bR" d="M172 94Q156 76 137 86Q154 82 172 94Z" fill={CREAM} stroke={CREAM} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g data-r="z" opacity="0" fill="none" stroke={RIM} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path data-r="z1" d="M0 0H10L0 12H10" /><path data-r="z2" d="M0 0H10L0 12H10" />
      </g>
    </svg>
  );
});

export default BeariMascot;
