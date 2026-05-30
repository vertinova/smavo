'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useQueueStore } from '@/lib/queueStore';

/**
 * Popup "Update tersedia" yang muncul otomatis ketika server melaporkan versi
 * build baru (ada deploy). Tombol "Update Sekarang" melakukan hard-refresh:
 * membersihkan cache + service worker lama lalu memuat ulang halaman, sehingga
 * perangkat (mis. layar antrean) langsung memakai kode terbaru tanpa perlu
 * disentuh manual.
 */
export function UpdateBanner() {
  const updateAvailable = useQueueStore((state) => state.updateAvailable);
  const [busy, setBusy] = useState(false);

  const handleUpdate = async () => {
    setBusy(true);
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch {
      // Abaikan — tetap reload walau pembersihan cache gagal.
    }
    // Cache-bust HTML juga agar tidak mengambil dokumen lama.
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.location.replace(url.toString());
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed inset-x-0 bottom-5 z-[9999] flex justify-center px-4"
          role="alertdialog"
          aria-live="assertive"
        >
          <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white shadow-2xl shadow-indigo-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight">Versi baru tersedia</p>
              <p className="text-xs text-white/80">Muat ulang untuk memakai pembaruan terbaru.</p>
            </div>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={busy}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-black text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-70"
            >
              <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
              {busy ? 'Memuat...' : 'Update Sekarang'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
