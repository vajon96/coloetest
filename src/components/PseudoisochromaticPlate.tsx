import React, { useEffect, useRef } from 'react';
import { createSeededRng } from '../lib/testEngine';
import { ExperimentalPlate } from '../types/vision';

interface PseudoisochromaticPlateProps {
  plate: ExperimentalPlate;
  size?: number;
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function jitterColor(hex: string, rng: () => number): string {
  const [h, s, l] = hexToHsl(hex);
  const hShift = (rng() - 0.5) * 6;
  const sShift = (rng() - 0.5) * 8;
  const lShift = (rng() - 0.5) * 14;
  return `hsl(${Math.round((h + hShift + 360) % 360)}, ${Math.max(
    12,
    Math.min(92, Math.round(s + sShift))
  )}%, ${Math.max(22, Math.min(78, Math.round(l + lShift)))}%)`;
}

function drawMaskShape(
  ctx: CanvasRenderingContext2D,
  plate: ExperimentalPlate,
  size: number
): void {
  const cx = size / 2;
  const cy = size / 2;
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (plate.stimulusType === 'number' || plate.stimulusType === 'letter') {
    const isTwoDigit = plate.targetValue.length >= 2;
    const fontSize = isTwoDigit ? size * 0.44 : size * 0.56;
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", "DM Sans", sans-serif`;
    ctx.fillText(plate.targetValue, cx, cy + size * 0.02);
    return;
  }

  if (plate.stimulusType === 'shape') {
    const r = size * 0.25;
    ctx.lineWidth = size * 0.075;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const val = plate.targetValue.toLowerCase();

    if (val === 'circle') {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (val === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.92, cy + r * 0.78);
      ctx.lineTo(cx - r * 0.92, cy + r * 0.78);
      ctx.closePath();
      ctx.stroke();
    } else if (val === 'square') {
      const half = r * 0.84;
      ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
    } else if (val === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 1.05);
      ctx.lineTo(cx + r * 0.85, cy);
      ctx.lineTo(cx, cy + r * 1.05);
      ctx.lineTo(cx - r * 0.85, cy);
      ctx.closePath();
      ctx.stroke();
    } else if (val === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (val === 'plus') {
      const arm = r * 0.95;
      ctx.beginPath();
      ctx.moveTo(cx - arm, cy);
      ctx.lineTo(cx + arm, cy);
      ctx.moveTo(cx, cy - arm);
      ctx.lineTo(cx, cy + arm);
      ctx.stroke();
    }
    return;
  }

  if (plate.stimulusType === 'path') {
    const val = plate.targetValue.toLowerCase();
    const leftX = size * 0.16;
    const rightX = size * 0.84;
    ctx.lineWidth = size * 0.085;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (val === 'top arc') {
      ctx.moveTo(leftX, cy + size * 0.08);
      ctx.quadraticCurveTo(cx, size * 0.14, rightX, cy + size * 0.08);
    } else if (val === 'bottom arc') {
      ctx.moveTo(leftX, cy - size * 0.08);
      ctx.quadraticCurveTo(cx, size * 0.86, rightX, cy - size * 0.08);
    } else if (val === 's-curve') {
      ctx.moveTo(leftX, cy + size * 0.16);
      ctx.bezierCurveTo(
        size * 0.38,
        size * 0.15,
        size * 0.62,
        size * 0.85,
        rightX,
        cy - size * 0.16
      );
    } else {
      ctx.moveTo(leftX, cy);
      ctx.lineTo(rightX, cy);
    }
    ctx.stroke();
  }
}

export const PseudoisochromaticPlate: React.FC<PseudoisochromaticPlateProps> = ({
  plate,
  size = 340,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Build offscreen stimulus mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = size;
    maskCanvas.height = size;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.clearRect(0, 0, size, size);
    drawMaskShape(maskCtx, plate, size);
    const maskData = maskCtx.getImageData(0, 0, size, size).data;

    const isForegroundPixel = (x: number, y: number): boolean => {
      const ix = Math.max(0, Math.min(size - 1, Math.round(x)));
      const iy = Math.max(0, Math.min(size - 1, Math.round(y)));
      return maskData[(iy * size + ix) * 4 + 3] > 96;
    };

    const rng = createSeededRng(plate.seed);
    const center = size / 2;
    const plateRadius = size * 0.47;

    interface Dot {
      x: number;
      y: number;
      r: number;
      fg: boolean;
    }

    const dots: Dot[] = [];
    const radiiBuckets = [10.5, 8.5, 6.8, 5.2, 3.8, 2.8].map((r) => (r * size) / 340);

    const overlapsExisting = (x: number, y: number, r: number): boolean => {
      const minGap = 1.35 * (size / 340);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = x - d.x;
        const dy = y - d.y;
        const limit = r + d.r + minGap;
        if (dx * dx + dy * dy < limit * limit) {
          return true;
        }
      }
      return false;
    };

    // Pack multi-scale circles inside the circular aperture
    for (const baseR of radiiBuckets) {
      const attempts = baseR > 7 ? 750 : 1400;
      for (let a = 0; a < attempts; a++) {
        const r = baseR * (0.85 + rng() * 0.28);
        const angle = rng() * Math.PI * 2;
        const dist = Math.sqrt(rng()) * (plateRadius - r - 2);
        const x = center + Math.cos(angle) * dist;
        const y = center + Math.sin(angle) * dist;

        if (!overlapsExisting(x, y, r)) {
          // Sample 5 points around the dot to ensure clean boundary adherence
          const cFg = isForegroundPixel(x, y);
          const edgeMatch =
            isForegroundPixel(x + r * 0.45, y) === cFg &&
            isForegroundPixel(x - r * 0.45, y) === cFg &&
            isForegroundPixel(x, y + r * 0.45) === cFg &&
            isForegroundPixel(x, y - r * 0.45) === cFg;

          if (edgeMatch || r <= 4.2 * (size / 340)) {
            dots.push({ x, y, r, fg: cFg });
          }
        }
      }
    }

    // Render onto high-DPI visible canvas
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Subtle clinical circular plate backdrop
    ctx.beginPath();
    ctx.arc(center, center, plateRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    const fgList = plate.fgPalette.length > 0 ? plate.fgPalette : ['#C9624B'];
    const bgList = plate.bgPalette.length > 0 ? plate.bgPalette : ['#6E964B'];

    for (const dot of dots) {
      const palette = dot.fg ? fgList : bgList;
      const baseHex = palette[Math.floor(rng() * palette.length)];
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fillStyle = jitterColor(baseHex, rng);
      ctx.fill();
    }

    ctx.restore();
  }, [plate, size]);

  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="max-w-full h-auto rounded-full"
        role="img"
        aria-label={`Experimental pseudoisochromatic screening plate in ${plate.category} category`}
      />
    </div>
  );
};
