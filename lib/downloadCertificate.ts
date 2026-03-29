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

  // 1. 🚀 Mobile-Proof Binary Font Injection
  await forceFontLoad(fontFamily);

  // 2. 🚀 CORS-Safe Image Loader
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
  // Standardizing the font string for all browsers
  ctx.font = `normal ${cert.fontSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = cert.fontColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
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

  // 5. Generate & stamp QR code (bottom-right corner)
  await stampQRCode(ctx, canvas.width, canvas.height, cert.certHash);

  // 6. Export as High-Quality PDF
  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const orientation = canvas.width > canvas.height ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  pdf.save(
    `CFC_Cert_${cert.eventTitle.replace(/\s+/g, "_")}_${cert.userName.replace(/\s+/g, "_")}.pdf`
  );
}

// ── QR Code Logic ──────────────────────────────────────────
async function stampQRCode(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  certHash: string
): Promise<void> {
  const verifyUrl = `${BASE_URL}/verify/${certHash}`;
  const qrSize = Math.max(80, Math.round(Math.min(canvasWidth, canvasHeight) * 0.08));
  const margin = 18;
  const padding = 6;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: qrSize,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  const qrImg = await loadImage(qrDataUrl);
  const totalSize = qrSize + padding * 2;
  const x = canvasWidth - totalSize - margin;
  const y = canvasHeight - totalSize - margin;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  
  // Custom rounded rect helper
  ctx.beginPath();
  const r = 6;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + totalSize - r, y);
  ctx.quadraticCurveTo(x + totalSize, y, x + totalSize, y + r);
  ctx.lineTo(x + totalSize, y + totalSize - r);
  ctx.quadraticCurveTo(x + totalSize, y + totalSize, x + totalSize - r, y + totalSize);
  ctx.lineTo(x + r, y + totalSize);
  ctx.quadraticCurveTo(x, y + totalSize, x, y + totalSize - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.drawImage(qrImg, x + padding, y + padding, qrSize, qrSize);

  ctx.save();
  ctx.font = `bold ${Math.max(8, Math.round(qrSize * 0.12))}px monospace`;
  ctx.fillStyle = "rgba(100,100,120,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("SCAN TO VERIFY", x + totalSize / 2, y + totalSize + 4);
  ctx.restore();
}

// ── The Production-Grade Font Injector ─────────────────────
async function forceFontLoad(fontFamily: string): Promise<void> {
  const genericFonts = ["monospace", "sans-serif", "serif", "cursive"];
  if (genericFonts.includes(fontFamily.toLowerCase())) return;

  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}&display=swap`;
    const response = await fetch(`${cssUrl}&t=${Date.now()}`);
    const css = await response.text();

    const match = css.match(/url\((https:\/\/[^)]+)\)/);
    if (!match) return;
    
    const fontUrl = match[1].replace(/['"]/g, ''); 
    const font = new FontFace(fontFamily, `url(${fontUrl})`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 250)); // GPU warm-up
  } catch (error) {
    console.warn("Font injection skipped, using fallback.");
  }
}

// ── The Mobile-Proof Image Loader ──────────────────────────
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

    const connector = src.includes('?') ? '&' : '?';
    // Only cachebust remote URLs, not dataURLs (like the QR code)
    img.src = src.startsWith('data:') ? src : `${src}${connector}nocache=${Date.now()}`;
  });
}