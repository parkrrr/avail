import { h } from 'preact';
import { useState } from 'preact/hooks';

interface Props {
  url: string;
  onClose: () => void;
}

export function ShareModal({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title" className="modal-header">
          Share Your Availability
        </h2>
        <div className="modal-body">
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Copy this URL to share your availability. Recipients will see times in their local timezone.
          </p>
          <div className="url-display">{url}</div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>
    </div>
  );
}
