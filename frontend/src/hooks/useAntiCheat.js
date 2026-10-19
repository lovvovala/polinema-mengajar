import { useEffect, useRef } from 'react';

/**
 * Memantau perpindahan tab, peminimalan browser, atau perpindahan ke aplikasi lain.
 * - document 'visibilitychange'  -> tab disembunyikan / browser diminimalkan
 * - window 'blur'                -> fokus berpindah ke aplikasi/jendela lain
 *
 * Satu kali meninggalkan halaman biasanya memicu KEDUA event tersebut hampir bersamaan,
 * sehingga dipakai penanda `awayRef` agar dihitung sebagai SATU pelanggaran.
 * Penanda baru dilepas ketika peserta benar-benar kembali (halaman terlihat dan berfokus).
 */
export function useAntiCheat({ enabled, onViolation }) {
  const handlerRef = useRef(onViolation);
  handlerRef.current = onViolation;
  const awayRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const pergi = () => {
      if (awayRef.current) return;
      awayRef.current = true;
      handlerRef.current?.();
    };
    const kembali = () => {
      if (!document.hidden && document.hasFocus()) awayRef.current = false;
    };
    const onVisibility = () => (document.hidden ? pergi() : kembali());

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', pergi);
    window.addEventListener('focus', kembali);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', pergi);
      window.removeEventListener('focus', kembali);
    };
  }, [enabled]);
}
