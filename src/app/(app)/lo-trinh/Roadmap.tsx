'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { PHASES } from '@/lib/phases';
import { ALL_TASKS, routeOf, statusOf } from '@/lib/journey';
import { toggleTask } from '@/app/actions';

export default function Roadmap({ initialDone, day }: { initialDone: string[]; day: number }) {
  const [done, setDone] = useState(() => new Set(initialDone));
  const [, start] = useTransition();
  const [err, setErr] = useState('');

  function flip(id: string, on: boolean) {
    setDone(prev => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
    start(async () => {
      const r = await toggleTask(id, on);
      if (!r.ok) {
        setErr('Chưa lưu được, thử lại.');
        setDone(prev => { const n = new Set(prev); on ? n.delete(id) : n.add(id); return n; });
      } else setErr('');
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {err && <div className="note warn">{err}</div>}
      {PHASES.map(p => {
        const n = p.tasks.filter(t => done.has(t.id)).length;
        return (
          <div className="phase" key={p.id}>
            <header>
              <span className="ph">{p.code}</span>
              <div><h3>{p.name}</h3><span className="win">{p.win}</span></div>
              <span className="num" style={{ fontWeight: 600 }}>{n}/{p.tasks.length}</span>
            </header>
            {p.tasks.map(t0 => {
              const t = ALL_TASKS.find(x => x.id === t0.id)!, isDone = done.has(t.id), st = statusOf(t, isDone, day);
              return (
                <label className={`task${isDone ? ' done' : ''}`} key={t.id}>
                  <input type="checkbox" checked={isDone} onChange={e => flip(t.id, e.target.checked)} />
                  <div>
                    <div className="t">{t.t}{t.rep && <span className="tag">{t.rep}</span>}</div>
                    <div className="d">
                      {t.d}
                      {t.link && <> · <Link href={routeOf(t.link)}>Xem hướng dẫn</Link></>}
                      {t.video && <> · <Link href={`/video?v=${t.video}`}>Xem video</Link></>}
                    </div>
                  </div>
                  <span className={`pill ${st.cls}`}>{st.label}</span>
                </label>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
