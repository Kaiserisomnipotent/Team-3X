import { requireActive } from '@/lib/auth';
import { publicQuizzes } from '@/lib/quizMeta';
import QuizForm from './QuizForm';

export default async function QuizPage() {
  const { supabase, profile } = await requireActive();
  const { data } = await supabase.from('quiz_scores').select('quiz_id,best_score,attempts').eq('user_id', profile.id);
  const best = Object.fromEntries((data || []).map(r => [r.quiz_id as string, { best: r.best_score as number, attempts: r.attempts as number }]));
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Học viên · Đánh giá</span>
        <h1>Bài kiểm tra</h1>
        <p className="lede">Mỗi bài 5 câu, đạt từ 4/5. Điểm cao nhất được lưu vào hồ sơ và chấm trên hệ thống. Làm lại bao nhiêu lần cũng được — mục tiêu là nhớ, không phải qua.</p>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {publicQuizzes().map(q => <QuizForm key={q.id} quiz={q} best={best[q.id]?.best ?? null} attempts={best[q.id]?.attempts ?? 0} />)}
      </div>
    </div>
  );
}
