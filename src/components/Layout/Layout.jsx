import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import Chat from '../Chat/Chat';
import Sidebar from '../Sidebar/Sidebar';
import { sendTurn } from '../../lib/chat';
import { createMessage, createSession, loadState, saveState, titleFrom } from '../../lib/storage';

const updateSession = (state, id, change) => ({
  ...state,
  sessions: state.sessions.map((session) => (session.id === id ? change(session) : session)),
});

// Only settled turns reach the model. A pending placeholder or a failed
// attempt would otherwise be replayed as if it were real conversation.
const historyFor = (messages) =>
  messages
    .filter((message) => message.status === 'done')
    .map(({ role, content }) => ({ role, content }));

const Layout = () => {
  const [state, setState] = useState(loadState);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => () => abortRef.current?.abort(), []);

  // The drawer is a dialog on small screens, so it has to be dismissible
  // without reaching for the mouse.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const active = state.sessions.find((session) => session.id === state.activeId) ?? state.sessions[0];

  const runTurn = useCallback(async (sessionId, history) => {
    const pending = createMessage('assistant', '');
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);

    setState((prev) =>
      updateSession(prev, sessionId, (session) => ({
        ...session,
        updatedAt: Date.now(),
        messages: [...session.messages, pending],
      })),
    );

    try {
      const { content, truncated } = await sendTurn({ messages: history, signal: controller.signal });

      setState((prev) =>
        updateSession(prev, sessionId, (session) => ({
          ...session,
          messages: session.messages.map((message) =>
            message.id === pending.id ? { ...message, content, status: 'done', truncated } : message,
          ),
        })),
      );
    } catch (err) {
      if (err.name === 'AbortError') return;

      setState((prev) =>
        updateSession(prev, sessionId, (session) => ({
          ...session,
          messages: session.messages.map((message) =>
            message.id === pending.id
              ? { ...message, content: err.message, status: 'error' }
              : message,
          ),
        })),
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const send = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || busy || !active) return;

      const history = [...historyFor(active.messages), { role: 'user', content: trimmed }];

      setState((prev) =>
        updateSession(prev, active.id, (session) => ({
          ...session,
          // Named after what the user typed, so nothing is invented.
          title: session.messages.length === 0 ? titleFrom(trimmed) : session.title,
          updatedAt: Date.now(),
          messages: [...session.messages, createMessage('user', trimmed)],
        })),
      );

      runTurn(active.id, history);
    },
    [active, busy, runTurn],
  );

  const retry = useCallback(() => {
    if (!active) return;
    const index = active.messages.findIndex(
      (message) => message.role === 'assistant' && message.status === 'error',
    );
    if (index === -1) return;

    const history = historyFor(active.messages.slice(0, index));

    setState((prev) =>
      updateSession(prev, active.id, (session) => ({
        ...session,
        messages: session.messages.slice(0, index),
      })),
    );

    runTurn(active.id, history);
  }, [active, runTurn]);

  const startNew = () => {
    setState((prev) => {
      const fresh = createSession();
      return { sessions: [fresh, ...prev.sessions], activeId: fresh.id };
    });
    setDrawerOpen(false);
  };

  const remove = (id) => {
    setState((prev) => {
      const remaining = prev.sessions.filter((session) => session.id !== id);
      // Deleting the last chat must not leave the app with nothing to render.
      if (remaining.length === 0) {
        const fresh = createSession();
        return { sessions: [fresh], activeId: fresh.id };
      }
      return {
        sessions: remaining,
        activeId: prev.activeId === id ? remaining[0].id : prev.activeId,
      };
    });
  };

  const select = (id) => {
    setState((prev) => ({ ...prev, activeId: id }));
    setDrawerOpen(false);
  };

  const sidebarProps = {
    sessions: state.sessions,
    activeId: active?.id,
    onSelect: select,
    onNew: startNew,
    onDelete: remove,
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <aside className="hidden w-72 shrink-0 md:block">
        <Sidebar {...sidebarProps} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-72">
            <Sidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex size-11 items-center justify-center rounded-md text-secondary hover:bg-inset"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <img
            src="/logo.jpg"
            alt=""
            width="24"
            height="24"
            className="size-6 rounded-[6px] object-cover"
          />
          <span className="font-display text-[15px] tracking-tight text-primary">Lazy Prompter</span>
        </div>

        {active ? (
          <Chat messages={active.messages} onSend={send} onRetry={retry} busy={busy} />
        ) : null}
      </div>
    </div>
  );
};

export default Layout;