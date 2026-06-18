// Normalisasi gambar di sisi client ke JPEG.
// Strategi berlapis:
// 1. Coba decode native via canvas dulu (cepat). Ini berhasil untuk JPEG/PNG/WEBP di semua
//    browser, dan untuk HEIC di Safari iPhone (decoder HEIC native) — tanpa muat WASM.
// 2. Kalau native gagal (umumnya HEIC di browser non-Safari yang tak bisa decode HEIC),
//    konversi dulu lewat heic-to (libheif WASM), baru normalkan.
// Hasil akhir selalu JPEG yang konsisten & sudah di-resize → preview & upload jalan di mana saja.

const MAX_DIMENSION = 1568; // cukup detail untuk vision model, hemat bandwidth
const JPEG_QUALITY = 0.9;

export interface NormalizedImage {
  blob: Blob;
}

export async function normalizeImage(file: File): Promise<NormalizedImage> {
  try {
    // Jalur cepat: decode langsung lewat canvas.
    return { blob: await canvasToJpeg(file) };
  } catch (nativeErr) {
    // Jalur HEIC: browser tidak bisa decode native, konversi via heic-to.
    try {
      const { heicTo } = await import("heic-to/next");
      const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: JPEG_QUALITY });
      return { blob: await canvasToJpeg(jpeg) };
    } catch (heicErr) {
      // Gabungkan info supaya log jelas, lalu lempar ulang.
      throw new Error(
        `Gagal memproses gambar. Native: ${describeError(nativeErr)} | HEIC: ${describeError(heicErr)}`
      );
    }
  }
}

// Muat sebuah blob gambar ke canvas, resize bila perlu, ekspor JPEG.
async function canvasToJpeg(source: Blob): Promise<Blob> {
  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await loadImage(objectUrl);

    let { width, height } = img;
    if (!width || !height) throw new Error("Dimensi gambar 0 (decode gagal)");

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

    // Latar putih supaya area transparan (PNG) tidak jadi hitam saat di-JPEG-kan.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("canvas.toBlob mengembalikan null");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("img gagal decode format ini"));
    img.src = src;
  });
}

function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
