import { useRef, useState, useEffect } from 'react';
import { YellowBtn, GhostBtn } from './UI';

export default function SignaturePad({ job, onSign, onClose }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setHasStrokes(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    e.preventDefault();
    setDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const confirm = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSign(dataUrl);
    setSigned(true);
  };

  if (signed) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
        <div className="bg-[#0d0d0d] border border-[#f59e0b] rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">✅</div>
          <p className="condensed text-2xl font-black text-[#f59e0b] mb-2">ESTIMATE APPROVED</p>
          <p className="text-[#A7A5A6] text-sm mb-6">Signature captured. The job status has been updated to Signed.</p>
          <YellowBtn onClick={onClose} className="w-full">Done</YellowBtn>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div>
          <p className="condensed text-xl font-black text-white">CUSTOMER APPROVAL</p>
          <p className="text-xs text-[#555]">{job.customerName} · {job.scopeTitle || job.jobType}</p>
        </div>
        <button onClick={onClose} className="text-[#444] hover:text-white text-2xl">✕</button>
      </div>

      {/* Quote summary */}
      <div className="bg-[#0d0d0d] border-b border-[#1a1a1a] px-6 py-3">
        <p className="text-xs text-[#555] mb-1">By signing below, I authorize the work described in this estimate.</p>
        <div className="flex gap-6 text-sm">
          <span className="text-[#A7A5A6]">Customer: <strong className="text-white">{job.customerName}</strong></span>
          <span className="text-[#A7A5A6]">Total: <strong className="text-[#f59e0b]">${(job.grandTotal || 0).toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Signature area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-sm text-[#A7A5A6]">Sign below with your finger or Apple Pencil</p>
        <div className="w-full max-w-2xl border-2 border-[#f59e0b]/40 rounded-xl overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={800}
            height={280}
            className="w-full touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <div className="w-full max-w-2xl border-t border-dashed border-[#333] pt-1 text-center">
          <p className="text-xs text-[#444]">x _____________________________ Customer Signature</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 py-4 flex gap-3 justify-end">
        <GhostBtn onClick={clear}>Clear</GhostBtn>
        <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        <YellowBtn onClick={confirm} disabled={!hasStrokes}>
          ✍ Confirm Signature
        </YellowBtn>
      </div>
    </div>
  );
}
