import { z } from 'zod';

export const registerSchema = z.object({
  namaLengkap: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(150),
  nim: z.string().trim().regex(/^\d{8,15}$/, 'NIM harus berupa angka (8-15 digit)'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  programStudi: z.string().trim().min(3, 'Program studi wajib diisi').max(150),
  divisiId: z.coerce.number().int().positive('Pilihan divisi wajib diisi'),
  linkPortofolio: z
    .string()
    .trim()
    .url('Link portofolio harus berupa URL yang valid')
    .or(z.literal(''))
    .optional(),
  motivasi: z.string().trim().min(50, 'Motivasi minimal 50 karakter').max(2000),
});

export const loginSchema = z.object({
  nim: z.string().trim().min(1, 'NIM wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const answerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  jawaban: z.enum(['A', 'B', 'C', 'D']).nullable(),
});

export const submitSchema = z.object({
  jawaban: z
    .array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        jawaban: z.enum(['A', 'B', 'C', 'D']).nullable(),
      })
    )
    .optional(),
  pelanggaran: z.coerce.number().int().min(0).max(10).optional(),
  alasan: z.enum(['normal', 'waktu_habis', 'pelanggaran']).default('normal'),
});

export const scheduleSchema = z.object({
  jadwalCbt: z.string().datetime({ offset: true }),
});

export const interviewSchema = z.object({
  jadwalWawancara: z.string().datetime({ offset: true }),
  lokasi: z.string().trim().min(3, 'Lokasi/tautan wawancara wajib diisi'),
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const galat = result.error.issues.map((i) => ({
        kolom: i.path.join('.'),
        pesan: i.message,
      }));
      return res.status(422).json({ pesan: galat[0]?.pesan || 'Data tidak valid.', galat });
    }
    req.body = result.data;
    next();
  };
}
