'use client';
import { useState, useTransition } from 'react';
import { submitQuiz } from '@/app/actions';
import type { PublicQuiz } from '@/lib/types';

const pill = (sc: number | null) =>
  sc == null ? <span className="pill s-idle">Chưa làm</span> : <span className={`pill ${sc === 5 ? 's-ceil' : sc >= 4 ? 's-up' : 's-down'}`}>{sc}/5</span>;

export default function QuizForm({ quiz, best, attempts }: { quiz: PublicQuiz; best: number | null; attempts: number }) {
  const [picks, setPicks] = useState<(number | null)[]>(() => quiz.qs.map(() => null));
  const [result, setResult] = useState<{ score: number; correct: number[] } | null>(null);
  const [bestNow, setBest] = useState(best);
  const [pending, start] = useTransition();

  const choose = (i: number, j: number) => {
    setPicks(p => p.map((x, k) => (k === i ? j : x)));
    if (result) setResult(null); // đổi đáp án sau khi nộp = làm lại
  };

  return (
    <form className="panel" onSubmit={e => {
      e.preventDefault();
      if (picks.some(p => p == null)) return;
      start(async () => {
        const r = await submitQuiz(quiz.id, picks as number[]);
        if (r.ok) { setResult({ score: r.score, correct: r.correct }); setBest(b => Math.max(b ?? 0, r.score)); }
      });
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <h3>{quiz.title}</h3>
        <span className="row">{attempts > 0 && <span className="srcline">{attempts} lần làm</span>}{pill(bestNow)}</span>
      </div>
      {quiz.qs.map((q, i) => (
        <fieldset className="q" key={i} style={{ border: 0, margin: 0, padding: '14px 0' }}>
          <legend className="qt" style={{ padding: 0 }}>{i + 1}. {q.q}</legend>
          {q.a.map((a, j) => {
            const cls = result ? (result.correct[i] === j ? 'ok' : picks[i] === j ? 'bad' : '') : '';
            return (
              <label key={j} className={cls}>
                <input type="radio" name={`${quiz.id}-${i}`} checked={picks[i] === j} onChange={() => choose(i, j)} required /> {a}
              </label>
            );
          })}
        </fieldset>
      ))}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
        <button className="btn" type="submit" disabled={pending}>{pending ? 'Đang chấm…' : 'Nộp bài'}</button>
        {result && <span className="srcline">{result.score >= 4 ? `Đạt ${result.score}/5. Đáp án đúng được tô xanh.` : `${result.score}/5 — chưa đạt. Xem đáp án xanh rồi chọn lại để làm lại.`}</span>}
      </div>
    </form>
  );
}
