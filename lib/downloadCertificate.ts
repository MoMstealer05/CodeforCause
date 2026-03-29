// lib/downloadCertificate.ts
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const BASE_URL = "https://cfc-charusat.vercel.app";

export async function downloadCertificate(cert: {
  userName: string;
  eventTitle: string;
  templateUrl: string;
  nameX: number;
  nameY: number;
  fontSize: number;
  fontColor: string;
  fontFamily?: string;
  certHash: string;
  issueDate: string;
}) {
  const fontFamily = cert.fontFamily?.trim() || "monospace";

  // 1. 🚀 ULTRA FONT LOAD: Fetch binary and force browser registration
  await forceFontLoad(fontFamily);

  // 2. Load template image with CORS bypass
  const img = await loadImage(cert.templateUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  // 3. Draw participant name
  const x = (cert.nameX / 100) * canvas.width;
  const y = (cert.nameY / 100) * canvas.height;

  ctx.save();
  // 🚀 MOBILE FIX: The font string must be exactly this format
  ctx.font = `normal ${cert.fontSize}px "${fontFamily}", cursive, sans-serif`;
  ctx.fillStyle = cert.fontColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Subtle shadow for readability on complex backgrounds
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillText(cert.userName, x, y);
  ctx.restore();

  // 4. Cert hash text stamp (bottom-left)
  ctx.save();
  ctx.font = `normal 11px monospace`;
  ctx.fillStyle = "rgba(120,120,120,0.6)";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`CERT#${cert.certHash} · ${cert.issueDate}`, 20, canvas.height - 14);
  ctx.restore();

  // 5. Stamp QR code
  await stampQRCode(ctx, canvas.width, canvas.height, cert.certHash);

  // 6. Export as High-Quality PDF
  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  pdf.save(`CFC_Cert_${cert.userName.replace(/\s+/g, "_")}.pdf`);
}

// ── THE DYNAMIC FONT INJECTOR ────────────────────────────
async function forceFontLoad(fontFamily: string): Promise<void> {
  const genericFonts = ["monospace", "sans-serif", "serif", "cursive"];
  if (genericFonts.includes(fontFamily.toLowerCase())) return;

  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}&display=swap`;
    const response = await fetch(cssUrl);
    const css = await response.text();

    const match = css.match(/url\((https:\/\/[^)]+)\)/);
    if (!match) return;
    const fontUrl = match[1].replace(/['"]/g, ''); 

    // Fetch raw binary to bypass mobile cache issues
    const fontRes = await fetch(fontUrl);
    const fontBuffer = await fontRes.arrayBuffer();

    const font = new FontFace(fontFamily, fontBuffer, { 
      style: 'normal', 
      weight: '400' 
    });
    
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);

    // 🚀 THE "GHOST TEXT" TRICK: 
    // We create a hidden span to force the browser to actually PAINT the font.
    // Without this, the font is "loaded" but not "active" in the browser's GPU.
    const ghost = document.createElement("span");
    ghost.style.fontFamily = `"${fontFamily}"`;
    ghost.style.visibility = "hidden";
    ghost.style.position = "absolute";
    ghost.innerText = "pre-render";
    document.body.appendChild(ghost);

    await document.fonts.ready;
    // Essential pause for mobile processors to rasterize curves
    await new Promise(r => setTimeout(r, 400));
    
    document.body.removeChild(ghost);
  } catch (error) {
    console.error("Font Load Failed:", error);
  }
}

// ── IMAGE LOADER WITH MOBILE CORS BYPASS ──────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = reject;
      fallback.src = src;
    };
    // Cache bust to prevent stale mobile storage
    const connector = src.includes('?') ? '&' : '?';
    img.src = src.startsWith('data:') ? src : `${src}${connector}cb=${Date.now()}`;
  });
}

// ── QR CODE STAMPER ──────────────────────────────────────
async function stampQRCode(ctx: CanvasRenderingContext2D, w: number, h: number, hash: string) {
  const verifyUrl = `${BASE_URL}/verify/${hash}`;
  const qrSize = Math.max(80, Math.round(Math.min(w, h) * 0.08));
  const padding = 6;
  const margin = 18;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: qrSize,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" }
  });

  const qrImg = await loadImage(qrDataUrl);
  const totalSize = qrSize + padding * 2;
  const x = w - totalSize - margin;
  const y = h - totalSize - margin;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 5;
  ctx.fillRect(x, y, totalSize, totalSize);
  ctx.drawImage(qrImg, x + padding, y + padding, qrSize, qrSize);
  
  ctx.font = `bold ${Math.max(8, Math.round(qrSize * 0.12))}px monospace`;
  ctx.fillStyle = "rgba(100,100,120,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("VERIFY", x + totalSize / 2, y + totalSize + 4);
  ctx.restore();
}