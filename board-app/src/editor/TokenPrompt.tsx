import { useState } from 'react';

interface Props {
  checking: boolean;
  rejected: boolean;
  onSubmit: (token: string) => void;
}

export function TokenPrompt({ checking, rejected, onSubmit }: Props) {
  const [value, setValue] = useState('');
  return (
    <form
      className="token-prompt"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <p>
        Paste a GitHub fine-grained token with <strong>Contents: read and write</strong> on this repo. It's stored
        only in this browser.
      </p>
      <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="github_pat_…" />
      <button type="submit" className="tag-btn active" disabled={checking}>
        {checking ? 'Checking…' : 'Edit board'}
      </button>
      {rejected && !checking && (
        <p className="board-status">That token can't write to the repo. Check it has Contents: read and write.</p>
      )}
    </form>
  );
}
