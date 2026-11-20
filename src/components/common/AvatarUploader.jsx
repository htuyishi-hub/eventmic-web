import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, ZoomIn } from 'lucide-react';
import { Button } from '../ui/Button';

export const CONSENT_TEXT = 'Shown to the organizers and, while you speak, to the room. Deleted when the session ends.';

export function AvatarUploader({ currentSrc, onSave, onRemove, onCancel }) {
  const [imageSrc, setImageSrc] = useState(currentSrc || null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const imgRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const exportWebpBlob = async () => {
    if (!imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const img = imgRef.current;
    const scale = zoom;
    const baseSize = 256;
    const drawW = baseSize * scale;
    const drawH = (img.naturalHeight / img.naturalWidth) * drawW;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(img, (256 - drawW) / 2 + pan.x, (256 - drawH) / 2 + pan.y, drawW, drawH);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else canvas.toBlob((fallbackBlob) => resolve(fallbackBlob), 'image/jpeg', 0.8);
      }, 'image/webp', 0.8);
    });
  };

  const handleSave = async () => {
    if (!imageSrc) return;
    const blob = await exportWebpBlob();
    if (blob && onSave) {
      onSave(blob, imageSrc);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-surface rounded-2xl max-w-sm mx-auto text-center border border-border">
      <div
        className="relative w-44 h-44 rounded-full overflow-hidden bg-background border-2 border-border shadow-inner cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Preview"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
            className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted text-xs p-4">
            <Camera className="w-8 h-8 mb-2 opacity-50" />
            <span>No photo selected</span>
          </div>
        )}
      </div>

      {imageSrc && (
        <div className="flex items-center gap-2 w-full px-4">
          <ZoomIn className="w-4 h-4 text-muted" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 w-full">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5"
        >
          <Camera className="w-4 h-4" /> Camera
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" /> Upload
        </Button>

        {(imageSrc || currentSrc) && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setImageSrc(null);
              onRemove();
            }}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" /> Remove
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted leading-relaxed px-2">
        {CONSENT_TEXT}
      </p>

      <div className="flex gap-2 w-full pt-2 border-t border-border/50">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Skip
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={!imageSrc}
          className="flex-1"
        >
          Save Photo
        </Button>
      </div>
    </div>
  );
}
