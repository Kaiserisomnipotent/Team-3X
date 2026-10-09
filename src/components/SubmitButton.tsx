'use client';
import { useFormStatus } from 'react-dom';

/** Nút gửi form: hiện "Đang lưu…" và khoá trong lúc chờ server, tránh bấm lặp và biết web đang xử lý. */
export default function SubmitButton({ children, className = 'btn', confirmText, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirmText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} type="submit" className={className} disabled={pending || rest.disabled}
      onClick={e => { if (confirmText && !window.confirm(confirmText)) e.preventDefault(); }}>
      {pending ? 'Đang lưu…' : children}
    </button>
  );
}
