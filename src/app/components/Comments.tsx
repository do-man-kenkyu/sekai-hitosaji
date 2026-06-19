import { useState, useEffect } from 'react';
import { MessageCircle, CornerDownRight, Trash2, Loader2, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User } from '../types';

interface CommentRow {
  id: string;
  condiment_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: { nickname: string; avatar_url: string | null } | null;
  replies?: CommentRow[];
}

interface Props {
  condimentId: string;
  currentUser: User | null;
}

export function Comments({ condimentId, currentUser }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(nickname, avatar_url)')
      .eq('condiment_id', condimentId)
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return; }

    const roots: CommentRow[] = [];
    const map: Record<string, CommentRow> = {};
    (data ?? []).forEach(c => { map[c.id] = { ...c, replies: [] }; });
    (data ?? []).forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    setComments(roots);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [condimentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      condiment_id: condimentId,
      user_id: currentUser.id,
      parent_id: replyTo?.id ?? null,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('このコメントを削除しますか？')) return;
    await supabase.from('comments').delete().eq('id', commentId);
    await fetchComments();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentRow; depth?: number }) => (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm flex-shrink-0">
          {comment.profiles?.nickname?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{comment.profiles?.nickname ?? '不明'}</span>
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            {depth === 0 && (
              <button
                onClick={() => setReplyTo({ id: comment.id, nickname: comment.profiles?.nickname ?? '不明' })}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 ml-auto"
              >
                <CornerDownRight size={12} />返信
              </button>
            )}
            {currentUser?.id === comment.user_id && (
              <button onClick={() => handleDelete(comment.id)}
                className="text-xs text-red-400 hover:text-red-600 ml-1">
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
        </div>
      </div>
      {comment.replies?.map(r => <CommentItem key={r.id} comment={r} depth={depth + 1} />)}
    </div>
  );

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
        <MessageCircle size={18} className="text-orange-500" />
        コメント
        <span className="text-sm font-normal text-gray-400">
          ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)})
        </span>
      </h3>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">まだコメントがありません。最初のコメントを投稿してみましょう！</p>
      ) : (
        <div className="divide-y divide-gray-50 mb-4">
          {comments.map(c => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}

      {currentUser ? (
        <form onSubmit={handleSubmit} className="mt-4">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              <CornerDownRight size={14} />
              <span>{replyTo.nickname} への返信</span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              maxLength={500}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{newComment.length}/500</p>
        </form>
      ) : (
        <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
          コメントするには<span className="text-orange-500 font-medium">ログイン</span>が必要です
        </p>
      )}
    </div>
  );
}
