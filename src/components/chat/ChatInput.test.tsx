// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';
import { MAX_MSG_CHARS } from '@/lib/schema';

const noop = () => {};

describe('ChatInput', () => {
  it('shows no counter when under 85% of the limit', () => {
    render(<ChatInput value="hello" onChange={noop} onSend={noop} disabled={false} />);
    expect(screen.queryByText(/\//)).toBeNull();
  });

  it('shows counter when approaching the limit', () => {
    const nearValue = 'a'.repeat(Math.floor(MAX_MSG_CHARS * 0.9));
    render(<ChatInput value={nearValue} onChange={noop} onSend={noop} disabled={false} />);
    expect(screen.getByText(/\/ 2,000/)).toBeInTheDocument();
  });

  it('shows error message when over the limit', () => {
    const overValue = 'a'.repeat(MAX_MSG_CHARS + 1);
    render(<ChatInput value={overValue} onChange={noop} onSend={noop} disabled={false} />);
    expect(screen.getByText(/Message too long/)).toBeInTheDocument();
  });

  it('disables send button when over the limit', () => {
    const overValue = 'a'.repeat(MAX_MSG_CHARS + 1);
    render(<ChatInput value={overValue} onChange={noop} onSend={noop} disabled={false} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('disables send button when input is empty', () => {
    render(<ChatInput value="" onChange={noop} onSend={noop} disabled={false} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('calls onSend when send button is clicked with valid input', async () => {
    const onSend = vi.fn();
    render(<ChatInput value="hello" onChange={noop} onSend={onSend} disabled={false} />);
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('does not call onSend when disabled', async () => {
    const onSend = vi.fn();
    render(<ChatInput value="hello" onChange={noop} onSend={onSend} disabled={true} />);
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });
});
