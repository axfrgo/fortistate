'use client';

import { useState, FormEvent } from 'react';
import { HelpCircle, Mail, MessageSquare, Send, ExternalLink } from 'lucide-react';

export default function SupportPage() {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setFeedback(null);

    const form = new FormData(event.currentTarget);
    const subject = form.get('subject')?.toString().trim();
    const message = form.get('message')?.toString().trim();

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      const body = await response.json().catch(() => ({ error: 'Request failed' }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to submit support ticket');
      }

      setFeedback('Your message has been sent successfully. We\'ll respond within 24 hours.');
      event.currentTarget.reset();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-vscode-text mb-2">Support</h1>
        <p className="text-vscode-text-secondary">
          Get help from the Fortistate team, browse documentation, or submit a support ticket.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-accent-primary" />
            <h2 className="text-xl font-semibold text-vscode-text">Email support</h2>
          </div>
          <p className="text-sm text-vscode-text-secondary">
            For urgent issues or detailed questions, email our support team directly at:
          </p>
          <a
            href="mailto:support@fortistate.dev"
            className="inline-flex items-center gap-2 text-accent-primary hover:underline"
          >
            support@fortistate.dev
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-vscode-text-tertiary">We typically respond within 24 hours.</p>
        </div>

        <div className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-accent-secondary" />
            <h2 className="text-xl font-semibold text-vscode-text">Knowledge base</h2>
          </div>
          <p className="text-sm text-vscode-text-secondary">
            Find answers to common questions, integration guides, and troubleshooting steps:
          </p>
          <a
            href="https://docs.fortistate.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent-primary hover:underline"
          >
            docs.fortistate.dev
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-vscode-text-tertiary">Updated weekly with new content.</p>
        </div>
      </section>

      <section className="vscode-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-accent-tertiary" />
          <h2 className="text-xl font-semibold text-vscode-text">Submit a ticket</h2>
        </div>
        <p className="text-sm text-vscode-text-secondary">
          Describe your issue below and we&apos;ll get back to you as soon as possible.
        </p>

        {feedback && (
          <div className="vscode-card border border-vscode-border p-4 bg-vscode-sidebar">
            <p className="text-sm text-vscode-text">{feedback}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-vscode-text mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              placeholder="Brief summary of your issue"
              className="vscode-input w-full"
              required
              disabled={sending}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-vscode-text mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              placeholder="Provide as much detail as possible..."
              className="vscode-input w-full resize-none"
              required
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </section>
    </div>
  );
}
