import { useCallback, useRef, useState } from 'react';

function baca(key, awal) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { nilai: awal, dipulihkan: false };
    return { nilai: { ...awal, ...JSON.parse(raw) }, dipulihkan: true };
  } catch {
    return { nilai: awal, dipulihkan: false };
  }
}

/**
 * Hook auto-save: setiap perubahan nilai langsung ditulis ke localStorage
 * (sinkron, pada setiap ketikan), sehingga progres tetap ada setelah
 * tab ditutup atau halaman di-refresh.
 *
 * Penggunaan:
 *   const [data, setData, { dipulihkan, tersimpanPada, hapus }] = useAutoSave('kunci', { ... });
 *   setData((prev) => ({ ...prev, nama: 'Budi' }));
 */
export function useAutoSave(key, initialValue) {
  const awal = useRef(null);
  if (awal.current === null) awal.current = baca(key, initialValue);

  const [nilai, setNilai] = useState(awal.current.nilai);
  const [tersimpanPada, setTersimpanPada] = useState(null);
  const terbaru = useRef(awal.current.nilai);

  const setValue = useCallback(
    (updater) => {
      const berikut = typeof updater === 'function' ? updater(terbaru.current) : updater;
      terbaru.current = berikut;
      try {
        localStorage.setItem(key, JSON.stringify(berikut));
        setTersimpanPada(Date.now());
      } catch {
        /* penyimpanan penuh/diblokir: lanjutkan tanpa menyimpan */
      }
      setNilai(berikut);
    },
    [key]
  );

  const hapus = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* abaikan */
    }
    terbaru.current = initialValue;
    setNilai(initialValue);
    setTersimpanPada(null);
  }, [key, initialValue]);

  return [nilai, setValue, { dipulihkan: awal.current.dipulihkan, tersimpanPada, hapus }];
}
