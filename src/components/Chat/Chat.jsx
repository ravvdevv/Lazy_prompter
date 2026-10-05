import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Copy, RotateCw, TriangleAlert } from 'lucide-react';

const STARTERS = [
  'Write a follow-up email to a client who missed the deadline',
  'Explain a React useEffect cleanup bug to a junior developer',
  'Turn messy meeting notes into a project brief',
];

const Composer = ({ onSend, busy }) => {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue('');
    onSend(text);
  };

  return (
    <div className="shrink-0 border-t border-line bg-canvas px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-lg border border-line bg-panel px-3 py-2 focus-within:border-line-strong">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // isComposing keeps IME candidate selection from firing a send.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            disabled={busy}
            placeholder="Describe what you need a prompt for"
            aria-label="Message"
            className="max-h-[200px] min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-primary placeholder:text-muted focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || busy}
            aria-label="Send message"
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-inset disabled:text-muted"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Enter to send, Shift + Enter for a new line. Replies are prompts to paste elsewhere.
        </p>
      </div>
    </div>
  );
};

const CopyButton = ({ text }) => {
  const [state, setState] = useState('idle');

  useEffect(() => {
    if (state === 'idle') return undefined;
    const timer = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState('copied');
        } catch {
          setState('failed');
        }
      }}
      className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2 text-[12px] text-secondary transition-colors hover:bg-inset hover:text-primary"
    >
      {state === 'copied' ? (
        <>
          <Check className="size-3.5 text-brand" aria-hidden="true" />
          Copied
        </>
      ) : state === 'failed' ? (
        'Copy blocked'
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden="true" />
          Copy
        </>
      )}
      <span className="sr-only">prompt to clipboard</span>
    </button>
  );
};

const Chat = ({ messages, onSend, onRetry, busy }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="py-10 sm:py-16">
              <h1 className="font-display text-2xl tracking-tight text-primary sm:text-3xl">
                What do you need a prompt for?
              </h1>
              <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-secondary">
                Describe the task in your own words. Ask for changes afterwards and the prompt
                gets rewritten rather than restarted.
              </p>
              <ul className="mt-6 flex flex-col gap-2">
                {STARTERS.map((starter) => (
                  <li key={starter}>
                    <button
                      type="button"
                      onClick={() => onSend(starter)}
                      className="w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-left text-[14px] text-secondary transition-colors hover:bg-inset hover:text-primary"
                    >
                      {starter}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {messages.map((message) =>
                message.role === 'user' ? (
                  <li key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-lg bg-inset px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-primary">
                      {message.content}
                    </p>
                  </li>
                ) : (
                  <li key={message.id}>
                    {message.status === 'pending' ? (
                      <div className="flex items-center gap-2.5 text-[13px] text-muted">
                        <img src="/logo.jpg" alt="" width="22" height="22" className="size-[22px] rounded-[5px] object-cover" />
                        <span>Writing the prompt</span>
                        <span
                          className="animate-indeterminate h-0.5 w-16 rounded-full"
                          style={{
                            backgroundImage:
                              'linear-gradient(90deg, #ff9a4a, #f6d45a 45%, #b7d3f7 75%, #3b8aff)',
                          }}
                        />
                      </div>
                    ) : message.status === 'error' ? (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-md border border-danger-line bg-danger-bg px-3.5 py-3"
                      >
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-secondary">{message.content}</p>
                          <button
                            type="button"
                            onClick={onRetry}
                            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-danger underline underline-offset-2"
                          >
                            <RotateCw className="size-3.5" aria-hidden="true" />
                            Try again
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <img
                          src="/logo.jpg"
                          alt=""
                          width="22"
                          height="22"
                          className="mt-0.5 size-[22px] shrink-0 rounded-[5px] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-primary">
                            {message.content}
                          </pre>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <CopyButton text={message.content} />
                            {message.truncated && (
                              <span className="text-[11px] text-muted">
                                Reply looks cut off. Ask for it again in two parts.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <Composer onSend={onSend} busy={busy} />
    </div>
  );
};

export default Chat;