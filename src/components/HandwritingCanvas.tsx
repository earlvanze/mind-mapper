import { useEffect, useRef, useState, useCallback } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import { useMindMapStore } from '../store/useMindMapStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function HandwritingCanvas({ open, onClose }: Props) {
  const { focusId, addChild, setText, nodes } = useMindMapStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [worker, setWorker] = useState<Worker | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const hasDrawn = useRef(false);

  // Init Tesseract worker once
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setProgress(0);
    setRecognizedText('');
    setIsRecognizing(false);

    createWorker('eng', 1, {
      logger: (m) => {
        if (cancelled) return;
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      },
    }).then((w) => {
      if (!cancelled) setWorker(w);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Draw canvas on open
  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    hasDrawn.current = false;
    setRecognizedText('');
    setProgress(0);
  }, [open]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPos(e);
    hasDrawn.current = true;
  };

  const moveDraw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d')!;
    const pt = getPos(e);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    lastPoint.current = pt;
  };

  const endDraw = () => setIsDrawing(false);

  const startDrawTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPos(e);
    hasDrawn.current = true;
  };

  const moveDrawTouch = (e: React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d')!;
    const pt = getPos(e);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    lastPoint.current = pt;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    hasDrawn.current = false;
    setRecognizedText('');
    setProgress(0);
  };

  const recognize = useCallback(async () => {
    if (!canvasRef.current || !worker) return;
    setIsRecognizing(true);
    setProgress(0);
    const { data } = await worker.recognize(canvasRef.current);
    setRecognizedText(data.text.trim());
    setIsRecognizing(false);
  }, [worker]);

  const insertAsNode = () => {
    if (!recognizedText.trim()) return;
    // Add child to focused node, then update text
    const targetId = focusId && focusId !== 'n_root' ? focusId : undefined;
    if (targetId) {
      addChild(targetId);
      // Get the newly created node id from focusId change
      const state = useMindMapStore.getState();
      const newId = state.focusId;
      if (newId) setText(newId, recognizedText.trim());
    } else {
      // Root case: just set root text
      setText('n_root', recognizedText.trim());
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Handwriting input"
        style={{
          background: 'var(--color-bg, #fff)',
          border: '1px solid var(--color-border, #d1d5db)',
          borderRadius: 12,
          padding: 20,
          width: 480,
          maxWidth: '95vw',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="hw-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            ✍️ Handwriting Input
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted, #6b7280)' }}>
          Draw on the canvas below. Click <strong>Recognize</strong> to convert to text, then <strong>Insert</strong> to add as a node.
        </p>

        {/* Canvas */}
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={440}
            height={220}
            style={{
              display: 'block',
              width: '100%',
              height: 220,
              border: '2px dashed var(--color-border, #d1d5db)',
              borderRadius: 8,
              cursor: 'crosshair',
              background: '#fafafa',
              touchAction: 'none',
            }}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDrawTouch}
            onTouchMove={moveDrawTouch}
            onTouchEnd={endDraw}
            aria-label="Drawing canvas"
            aria-describedby="hw-canvas-hint"
          />
          {!hasDrawn.current && (
            <div
              id="hw-canvas-hint"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: '#9ca3af',
                fontSize: 14,
              }}
            >
              Draw here…
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={clearCanvas}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Clear
          </button>
          <button
            onClick={recognize}
            disabled={!hasDrawn.current || isRecognizing}
            style={{
              flex: 2,
              padding: '8px 12px',
              background: '#1e40af',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: hasDrawn.current && !isRecognizing ? 'pointer' : 'not-allowed',
              fontSize: 13,
              opacity: hasDrawn.current ? 1 : 0.5,
            }}
          >
            {isRecognizing ? `Recognizing… ${progress}%` : 'Recognize'}
          </button>
        </div>

        {/* Recognized text */}
        {recognizedText && (
          <div>
            <label id="hw-result-label" style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, display: 'block' }}>
              Recognized text:
            </label>
            <div
              id="hw-result"
              role="status"
              aria-live="polite"
              style={{
                padding: '8px 10px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 6,
                fontSize: 14,
                minHeight: 40,
                whiteSpace: 'pre-wrap',
                color: '#166534',
              }}
            >
              {recognizedText}
            </div>
          </div>
        )}

        {/* Insert */}
        {recognizedText && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={insertAsNode}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Insert as Node
            </button>
            <button
              onClick={clearCanvas}
              style={{
                padding: '10px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
