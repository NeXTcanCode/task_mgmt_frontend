import React from 'react';
import Icon from './Icon';

function unavailableText(error) {
  if (error.status === 404) return "AI insights aren't set up on the server yet.";
  if (error.status === 429) return 'Too many requests, try again in a minute.';
  return error.message;
}

// `query` is the TanStack Query result of useInsights / useTaskInsights.
// LLM output is untrusted: rendered as plain text only.
export default function AiSummaryCard({ title = 'AI summary', query }) {
  const { data, error, isPending, isFetching, refetch } = query;
  return <section className="insight-card ai-card h-100" aria-labelledby="ai-summary-title" aria-busy={isFetching}>
    <div className="d-flex align-items-center justify-content-between gap-2">
      <h3 className="insight-card-title mb-0" id="ai-summary-title"><Icon name="sparkles" size={16} /> {title}</h3>
      <button type="button" className="btn btn-sm btn-light" onClick={() => refetch()} disabled={isFetching} aria-label="Regenerate AI summary" title="Regenerate">
        <Icon name="refresh" size={14} className={isFetching ? 'spin' : ''} /> <span className="d-none d-sm-inline">Regenerate</span>
      </button>
    </div>

    {isPending && !error && <div className="mt-3" role="status">
      <span className="skeleton skeleton-line" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line short" />
      <span className="small text-muted">Generating summary…</span>
    </div>}

    {error && <p className="text-muted mt-3 mb-0">{unavailableText(error)}</p>}

    {data && !data.aiGenerated && <p className="text-muted mt-3 mb-0">AI summary unavailable right now.</p>}

    {data?.aiGenerated && <div className="mt-3">
      <p className="ai-summary-text">{data.summary}</p>
      {data.tips?.length > 0 && <ul className="ai-tips">{data.tips.map((tip, index) => <li key={index}>{tip}</li>)}</ul>}
      <span className="small text-muted">AI generated. Check anything important.</span>
    </div>}
  </section>;
}
