export type Task = {
  id: string;
  t: string;          // tên đầu việc
  d: string;          // mô tả
  link?: string;      // '#sop-zalo' → trang hướng dẫn
  quiz?: string;      // bài kiểm tra liên quan
  rep?: string;       // 'Hằng ngày' | 'Hằng tuần'
  video?: string;     // (tuỳ chọn) ID video Bunny Stream gắn với đầu việc
};

export type Phase = {
  id: string;
  code: string;
  name: string;
  win: string;
  from: number;       // ngày bắt đầu (tính từ ngày nhận việc)
  to: number;         // hạn chót
  tasks: Task[];
};

export type QuizQuestion = { q: string; a: string[]; c: number };
export type Quiz = { id: string; title: string; qs: QuizQuestion[] };
export type PublicQuiz = { id: string; title: string; qs: { q: string; a: string[] }[] };

export type Doc = { name: string; folder: string; path?: string; use: string; url?: string };

export type Role = 'pending' | 'member' | 'leader' | 'admin' | 'disabled';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  team: string | null;
  start_date: string;   // yyyy-mm-dd
  role: Role;
  is_owner: boolean;
  leader_id: string | null;
  created_at: string;
};

export type Video = { id: string; bunny_id: string; module: string; title: string; minutes: number | null; note: string; sort: number };

export type KpiLog = {
  id: string;
  user_id: string;
  log_date: string;
  new_accounts: number;
  id_transfers: number;
  net_fee: number;
};

export type Checkin = {
  id: string;
  user_id: string;
  checkin_date: string;
  did: string;
  result: string;
  need_help: string;
  help_status: 'none' | 'open' | 'resolved';
  leader_reply: string | null;
  replied_by: string | null;
  updated_at: string;
};

export type AssignedTask = {
  id: string;
  assignee: string;
  created_by: string | null;
  title: string;
  detail: string;
  due_date: string | null;
  status: 'todo' | 'doing' | 'done';
  created_at: string;
};
