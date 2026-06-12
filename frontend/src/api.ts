// Merkezi API Konfigürasyonu
// Production modda relative URL kullanılır (/api/...) —
// böylece hem localhost hem LAN hem VPS'te rebuild gerekmeden çalışır.
// Dev modda proxy veya VITE_API_URL env değişkeni kullanılır.
//
// Senaryo 1 (Tek PC):   relative URL → /api/...  → localhost:3000
// Senaryo 2 (LAN):      relative URL → /api/...  → 192.168.x.x:3000 (otomatik)
// Senaryo 3 (Supabase): relative URL → /api/...  → aynı sunucu, VT bulutta
// Senaryo 4 (VPS):      relative URL → /api/...  → nginx üzerinden
//
// VITE_API_URL sadece farklı bir sunucuya (cross-origin) bağlanmak gerektiğinde kullanılır.

const configured = import.meta.env.VITE_API_URL as string;

// Production modda: relative URL (same-origin) — en evrensel çözüm
// Dev modda: VITE_API_URL varsa onu kullan, yoksa relative (vite proxy devreye girer)
export const API_BASE = configured || '';

/**
 * API URL'ini döndürür.
 * Production: '/api/expenses'           → same-origin (her senaryoda çalışır)
 * Dev:        'http://localhost:3000/api/expenses' (VITE_API_URL set edilmişse)
 */
export const apiUrl = (path: string): string => {
  return `${API_BASE}${path}`;
};
