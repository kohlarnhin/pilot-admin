import { t, useT } from '@/i18n';
import { isValidElement, memo, useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { CopyButton } from '@/components/common/CopyButton';
import { Link, useLocation } from 'react-router';

function AssistantLink({ href, children, sessionId }: { href?: string; children?: ReactNode; sessionId?: string }) {
  const location = useLocation();
  const internal = href?.startsWith('/') && !href.startsWith('//');
  if (internal && href) return <Link to={href} state={location.pathname.replace(/\/+$/, '') === '/agent' ? { agentReturnTo: sessionId ? `/agent?session=${encodeURIComponent(sessionId)}` : '/agent' } : undefined}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function textContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return isValidElement<{ children?: ReactNode }>(node) ? textContent(node.props.children) : '';
}

function CodeBlock({ children }: { children?: ReactNode }) {
  useT();
  const code = isValidElement<{ className?: string }>(children) ? children : null;
  const language = code?.props.className?.replace('language-', '') || t('assistant.markdown.code');

  return (
    <div className="my-3 min-w-0 overflow-hidden rounded-lg border border-line bg-slate-50/70">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5 text-[11px] text-slate-500">
        <span className="truncate font-mono">{language}</span>
        <CopyButton text={textContent(children).replace(/\n$/, '')} tip={t('assistant.markdown.copyCode')} secret className="size-6" />
      </div>
      <pre className="ai-assistant-scroll max-w-full overflow-x-auto p-3 font-mono text-xs leading-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-300" tabIndex={0} aria-label={t('assistant.markdown.codeRegion', { language })}>
        {children}
      </pre>
    </div>
  );
}

function MarkdownTable({ children }: { children?: ReactNode }) {
  useT();
  return (
    <div className="ai-assistant-scroll my-3 max-w-full overflow-x-auto rounded-lg border border-line outline-none focus-visible:ring-2 focus-visible:ring-slate-300" role="region" aria-label={t('assistant.markdown.tableRegion')} tabIndex={0}>
      <table className="w-full border-collapse whitespace-nowrap text-left text-xs leading-5">{children}</table>
    </div>
  );
}

const components: Components = {
  pre: CodeBlock,
  a: ({ node: _node, children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: MarkdownTable,
};
const remarkPlugins = [remarkGfm, remarkBreaks];

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, sessionId }: { content: string; sessionId?: string }) {
  const markdownComponents = useMemo<Components>(() => ({ ...components,
    a: ({ href, children }) => <AssistantLink href={href} sessionId={sessionId}>{children}</AssistantLink>,
  }), [sessionId]);
  return (
    <div className="ai-message-content min-w-0 max-w-full text-13 leading-7 [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
});
