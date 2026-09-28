"use client";

/**
 * SectionAnimations — scroll-reveal orchestrator for all page sections.
 *
 * Mounts once (returns null). Uses IntersectionObserver for all one-shot
 * enter-once reveals so they work regardless of scroll driver (Lenis, native,
 * Playwright window.scrollTo, etc.). Uses GSAP ScrollTrigger only for the
 * two scrub-based animations: LossChart stroke and About timeline fill.
 *
 * Sections covered:
 *   · Section headers: hairline draw + h2 word-by-word reveal (italic word last)
 *   · Work: top/bottom panels stagger fade-up + corner brackets draw in
 *   · Capabilities: cap-cells stagger
 *   · DataScience: KPI cards stagger, importance bars scaleX, pipeline steps
 *   · Stack: rows slide from left
 *   · About: blockquote + bio fade, timeline line fill (scrub), dots light up
 *   · Writing: post-rows stagger
 *   · Contact: panels stagger
 *   · LossChart: stroke-dashoffset scrubbed with scroll (GSAP ScrollTrigger)
 *
 * Uses the ONE Lenis + ScrollTrigger RAF loop already in ScrollProvider.
 * All animations respect prefers-reduced-motion (instant, no transform).
 */

import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ── H2 word splitter ─────────────────────────────────────────────────────────
interface WordSplit { normal: HTMLElement[]; em: HTMLElement[] }

function splitH2(h2: Element): WordSplit {
  const normal: HTMLElement[] = [];
  const em:     HTMLElement[] = [];
  const frag    = document.createDocumentFragment();

  Array.from(h2.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      (node.textContent || '').split(/(\s+)/).forEach(part => {
        if (part.trim()) {
          const s = document.createElement('span');
          s.className = 'h2w';
          s.textContent = part;
          frag.appendChild(s);
          normal.push(s);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const wrap = document.createElement('span');
      wrap.className = 'h2w h2w-em';
      wrap.appendChild((node as Element).cloneNode(true));
      frag.appendChild(wrap);
      em.push(wrap);
    }
  });

  h2.innerHTML = '';
  h2.appendChild(frag);
  return { normal, em };
}

// ── One-shot IntersectionObserver helper ─────────────────────────────────────
// Fires cb once when el enters the viewport, then disconnects.
function onEnter(
  el: Element,
  cb: () => void,
  threshold = 0.1,
): IntersectionObserver {
  const obs = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      cb();
    },
    { threshold },
  );
  obs.observe(el);
  return obs;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SectionAnimations() {
  // ── IntersectionObserver-based reveals (all one-shot enter-once) ──────────
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observers: IntersectionObserver[] = [];
    const cleanup: (() => void)[] = [];

    if (reduceMotion) {
      document.querySelectorAll('.section-label').forEach(el => el.classList.add('in-view'));
      document.querySelectorAll('.corner').forEach(el => el.classList.add('bk-in'));
      gsap.set('.importance-bar', { scaleX: 1 });
      return;
    }

    // ── Section headers ──────────────────────────────────────────────────
    document.querySelectorAll('.shead').forEach(shead => {
      const label = shead.querySelector('.section-label') as HTMLElement | null;
      const h2    = shead.querySelector('h2') as HTMLElement | null;
      const desc  = shead.querySelector('p')  as HTMLElement | null;
      if (!label || !h2) return;

      const { normal, em } = splitH2(h2);
      gsap.set([...normal, ...em], { opacity: 0 });

      observers.push(onEnter(shead, () => {
        label.classList.add('in-view');

        gsap.to(normal, {
          opacity:  1,
          duration: 0.45,
          stagger:  0.055,
          ease:     'power2.out',
          delay:    0.15,
        });
        if (em.length) {
          gsap.to(em, {
            opacity:  1,
            duration: 0.55,
            ease:     'power2.out',
            delay:    0.15 + normal.length * 0.055 + 0.12,
          });
        }
        if (desc) {
          gsap.from(desc, {
            opacity:    0,
            y:          14,
            duration:   0.6,
            ease:       'power2.out',
            delay:      0.35,
            clearProps: 'all',
          });
        }
      }, 0.08));
    });

    // ── Work: top panels ─────────────────────────────────────────────────
    const workTop = document.querySelectorAll('.work-top > div');
    if (workTop.length) {
      gsap.set(workTop, { opacity: 0, y: 28 });
      observers.push(onEnter(document.querySelector('.work-top')!, () => {
        gsap.to(workTop, {
          opacity:    1,
          y:          0,
          duration:   0.75,
          stagger:    0.1,
          ease:       'power3.out',
          clearProps: 'all',
          onComplete() {
            workTop.forEach(el => el.classList.add('bk-in'));
          },
        });
      }, 0.05));
    }

    // Work: bottom panels
    const workBottom = document.querySelectorAll('.work-bottom > div');
    if (workBottom.length) {
      gsap.set(workBottom, { opacity: 0, y: 24 });
      observers.push(onEnter(document.querySelector('.work-bottom')!, () => {
        gsap.to(workBottom, {
          opacity:    1,
          y:          0,
          duration:   0.65,
          stagger:    0.08,
          ease:       'power3.out',
          clearProps: 'all',
          onComplete() {
            workBottom.forEach(el => el.classList.add('bk-in'));
          },
        });
      }, 0.05));
    }

    // ── Capabilities ─────────────────────────────────────────────────────
    const capGrid = document.querySelector('.cap-grid');
    const capCells = document.querySelectorAll('.cap-cell');
    if (capGrid && capCells.length) {
      gsap.set(capCells, { opacity: 0, y: 20 });
      observers.push(onEnter(capGrid, () => {
        gsap.to(capCells, {
          opacity:    1,
          y:          0,
          duration:   0.6,
          stagger:    0.07,
          ease:       'power2.out',
          clearProps: 'all',
        });
      }, 0.05));
    }

    // ── DataScience: KPI cards ────────────────────────────────────────────
    const kpiGrid = document.querySelector('.kpi-grid');
    const kpiCards = document.querySelectorAll('.kpi-grid .panel');
    if (kpiGrid && kpiCards.length) {
      gsap.set(kpiCards, { opacity: 0, y: 20 });
      observers.push(onEnter(kpiGrid, () => {
        gsap.to(kpiCards, {
          opacity:    1,
          y:          0,
          duration:   0.6,
          stagger:    0.08,
          ease:       'power2.out',
          clearProps: 'all',
        });
      }, 0.05));
    }

    // DataScience: importance bars
    const bars = document.querySelectorAll('.importance-bar');
    if (bars.length) {
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left' });
      const barPanel = bars[0].closest('.panel') ?? bars[0];
      observers.push(onEnter(barPanel, () => {
        gsap.to(bars, {
          scaleX:   1,
          duration: 1.2,
          stagger:  0.08,
          ease:     'power3.out',
        });
      }, 0.05));
    }

    // DataScience: ds-bottom panels
    const dsBottom = document.querySelector('.ds-bottom');
    const dsBottomItems = document.querySelectorAll('.ds-bottom > div');
    if (dsBottom && dsBottomItems.length) {
      gsap.set(dsBottomItems, { opacity: 0, y: 20 });
      observers.push(onEnter(dsBottom, () => {
        gsap.to(dsBottomItems, {
          opacity:    1,
          y:          0,
          duration:   0.65,
          stagger:    0.1,
          ease:       'power2.out',
          clearProps: 'all',
        });
      }, 0.05));
    }

    // ── Stack rows ───────────────────────────────────────────────────────
    const stackRows = document.querySelectorAll('.stack-row');
    const stackContainer = document.querySelector('#stack .wrap > div');
    if (stackContainer && stackRows.length) {
      gsap.set(stackRows, { opacity: 0, x: -22 });
      observers.push(onEnter(stackContainer, () => {
        gsap.to(stackRows, {
          opacity:    1,
          x:          0,
          duration:   0.55,
          stagger:    0.06,
          ease:       'power2.out',
          clearProps: 'all',
        });
      }, 0.05));
    }

    // ── About: blockquote + bio ───────────────────────────────────────────
    const aboutGrid = document.querySelector('#about .about-grid');
    const aboutRight = document.querySelector('#about .about-grid > div:last-child');
    if (aboutGrid && aboutRight) {
      gsap.set(aboutRight, { opacity: 0, y: 20 });
      observers.push(onEnter(aboutGrid, () => {
        gsap.to(aboutRight, {
          opacity:    1,
          y:          0,
          duration:   0.7,
          delay:      0.1,
          ease:       'power2.out',
          clearProps: 'all',
        });
      }, 0.05));
    }

    // About photo
    const aboutPhoto = document.querySelector('#about .about-grid > div:first-child > div:first-child');
    if (aboutPhoto && aboutGrid) {
      gsap.set(aboutPhoto, { opacity: 0 });
      observers.push(onEnter(aboutGrid, () => {
        gsap.to(aboutPhoto, { opacity: 1, duration: 0.8, ease: 'power2.out', clearProps: 'all' });
      }, 0.05));
    }

    // About timeline dots (each dot lights up separately)
    document.querySelectorAll('.timeline-item').forEach(item => {
      observers.push(onEnter(item, () => item.classList.add('lit'), 0.3));
    });

    // ── Writing rows ─────────────────────────────────────────────────────
    const writingContainer = document.querySelector('#writing .wrap > div');
    const postRows = document.querySelectorAll('.post-row');
    if (writingContainer && postRows.length) {
      gsap.set(postRows, { opacity: 0, y: 16 });
      observers.push(onEnter(writingContainer, () => {
        gsap.to(postRows, {
          opacity:    1,
          y:          0,
          duration:   0.55,
          stagger:    0.08,
          ease:       'power2.out',
          clearProps: 'all',
        });
      }, 0.05));
    }

    // ── Contact: form + links panels ──────────────────────────────────────
    const contactGrid = document.querySelector('#contact .contact-grid');
    const contactPanels = document.querySelectorAll('#contact .contact-grid > *');
    if (contactGrid && contactPanels.length) {
      gsap.set(contactPanels, { opacity: 0, y: 20 });
      observers.push(onEnter(contactGrid, () => {
        gsap.to(contactPanels, {
          opacity:    1,
          y:          0,
          duration:   0.7,
          stagger:    0.1,
          ease:       'power2.out',
          clearProps: 'all',
          onComplete() {
            contactPanels.forEach(el => el.classList.add('bk-in'));
          },
        });
      }, 0.1));
    }

    return () => {
      observers.forEach(obs => obs.disconnect());
      cleanup.forEach(fn => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GSAP ScrollTrigger: scrub-only animations ─────────────────────────────
  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Loss chart: stroke-dashoffset scrubbed with scroll
    const lossLine = document.getElementById('loss-line') as SVGPolylineElement | null;
    if (lossLine) {
      const len = (lossLine as unknown as SVGGeometryElement).getTotalLength?.() ?? 0;
      if (len > 0) {
        gsap.set(lossLine, { strokeDasharray: len, strokeDashoffset: len });
        const lossPanel = lossLine.closest('.panel') as Element | null;
        ScrollTrigger.create({
          trigger: lossPanel ?? lossLine,
          start:   'top 80%',
          end:     'bottom 35%',
          scrub:   1.5,
          onUpdate(self) {
            gsap.set(lossLine, { strokeDashoffset: len * (1 - self.progress) });
          },
        });
      }
    }

    // About timeline: vertical fill line scrubbed with scroll
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      const fill = document.createElement('div');
      fill.className = 'timeline-fill';
      (timeline as HTMLElement).appendChild(fill);

      ScrollTrigger.create({
        trigger: timeline,
        start:   'top 65%',
        end:     'bottom 45%',
        scrub:   0.8,
        onUpdate(self) {
          (fill as HTMLElement).style.height = `${self.progress * 100}%`;
        },
      });
    }

    ScrollTrigger.refresh();
  });

  return null;
}
