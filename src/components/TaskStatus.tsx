'use client';
import { useState, useTransition } from 'react';
import { setTaskStatus } from '@/app/actions';

const LABEL = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Xong' } as const;
type S = keyof typeof LABEL;

/** Ba nút trạng thái: đổi ngay trên màn hình, lưu ngầm; nếu lưu lỗi thì trả lại và báo rõ. */
export default function TaskStatus({ id, status }: { id: string; status: S }) {
  const [cur, setCur] = useState<S>(status);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();

  function pick(s: S) {
    if (s === cur || pending) return;
    const prev = cur;
    setCur(s); setErr('');
    start(async () => {
      const r = await setTaskStatus(id, s);
      if (!r.ok) { setCur(prev); setErr(r.msg || 'Chưa lưu được, thử lại.'); }
    });
  }

  return (
    <div>
      <div className="row">
        {(Object.keys(LABEL) as S[]).map(s => (
          <button key={s} type="button" className={`btn sm${cur === s ? '' : ' ghost'}`} disabled={pending} onClick={() => pick(s)}>{LABEL[s]}</button>
        ))}
      </div>
      {err && <div className="note warn" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}
