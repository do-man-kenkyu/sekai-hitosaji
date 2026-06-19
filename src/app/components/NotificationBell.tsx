import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, CornerDownRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User } from '../types';

interface NotificationRow {
  id: string;
  type: 'like' | 'comment' | 'reply';
  read: boolean;
  created_at: string;
  actor: { nickname: string } | null;
  condiment: { name: string } | null;
}

interface Props {
  currentUser: User;
}

export function NotificationBell({ currentUser }: Props) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, actor:profiles!actor_id(nickname), condiment:condiments(name)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications((data ?? []) as NotificationRow[]);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`,
      }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', currentUser.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const icon = (type: string) => {
    if (type === 'like') return <Heart size={14} className="text-red-400" />;
    if (type === 'comment') return <MessageCircle size={14} className="text-blue-400" />;
    return <CornerDownRight size={14} className="text-green-400" />;
  };

  const message = (n: NotificationRow) => {
    const actor = n.actor?.nickname ?? '誰か';
    const name = n.condiment?.name ?? '調味料';
    if (n.type === 'like') return `${actor}さんが「${name}」にいいねしました`;
    if (n.type === 'comment') return `${actor}さんが「${name}」にコメントしました`;
    return `${actor}さんがあなたの返信に返信しました`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="通知"
      >
        <Bell size={20} className="text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">通知</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              通知はありません
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y">
              {notifications.map(n => (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-orange-50' : ''}`}
                >
                  <div className="mt-0.5">{icon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{message(n)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
