import 'server-only';
import { QUIZZES } from './quizzes';
import type { PublicQuiz } from './types';

export const QUIZ_COUNT = QUIZZES.length;
/** Câu hỏi KHÔNG kèm đáp án — an toàn để gửi xuống trình duyệt. */
export const publicQuizzes = (): PublicQuiz[] => QUIZZES.map(q => ({ id: q.id, title: q.title, qs: q.qs.map(x => ({ q: x.q, a: x.a })) }));
