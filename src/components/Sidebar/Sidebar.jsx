import { useState } from 'react';
import { Blobatar } from '@blobatar/react';
import { Github, Pencil, Plus, Trash2, X } from 'lucide-react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const REPO_URL = 'https://github.com/ravvdevv/Lazy_prompter';

const relativeTime = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const SessionRow = ({ session, active, onSelect, onDelete }) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onSelect(session.id);
        }}
        aria-current={active ? 'page' : undefined}
        className={`flex w-full items-center justify-between gap-2 rounded-md py-2 pl-2.5 pr-9 text-left text-[13px] transition-colors ${
          active ? 'bg-inset text-primary' : 'text-secondary hover:bg-inset hover:text-primary'
        }`}
      >
        <span className="truncate">{session.title}</span>
        <span className="shrink-0 text-[11px] text-muted">{relativeTime(session.updatedAt)}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          setConfirming(false);
          onDelete(session.id);
        }}
        aria-label={confirming ? `Confirm delete ${session.title}` : `Delete ${session.title}`}
        className={`absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
          confirming
            ? 'bg-danger-bg text-danger'
            : 'text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-inset hover:text-danger'
        }`}
      >
        {confirming ? <X className="size-3.5" aria-hidden="true" /> : <Trash2 className="size-3.5" aria-hidden="true" />}
      </button>
    </div>
  );
};

const Sidebar = ({ sessions, activeId, onSelect, onNew, onDelete, onClose }) => {
  // Newest activity first. Sorting here rather than on insert keeps the order
  // correct as older chats get new messages and their updatedAt moves.
  const ordered = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full flex-col border-r border-line bg-panel">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt=""
            width="28"
            height="28"
            className="size-7 shrink-0 rounded-[6px] object-cover"
          />
          <span className="truncate font-display text-[17px] tracking-tight text-primary">
            Lazy Prompter
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-inset hover:text-primary"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex h-11 w-full items-center gap-2.5 rounded-md border border-line px-3 text-[13px] font-medium text-primary transition-colors hover:bg-inset"
        >
          <Pencil className="size-4 text-muted" aria-hidden="true" />
          New chat
        </button>
      </div>

      <nav aria-label="Chat history" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {ordered.length === 0 ? (
          <p className="px-2.5 py-3 text-[13px] text-muted">No chats yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {ordered.map((session) => (
              <li key={session.id}>
                <SessionRow
                  session={session}
                  active={session.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-2.5">
          <Blobatar name="raven" size={28} background="squircle" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-secondary">Raven</p>
            <p className="truncate text-[11px] text-muted">Built by hand</p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source on GitHub"
            className="flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-inset hover:text-primary"
          >
            <Github className="size-4" aria-hidden="true" />
          </a>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted">Pollinations</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;