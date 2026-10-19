import jwt from 'jsonwebtoken';

export function signToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

// Autentikasi peserta (JWT)
export function requireApplicant(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ pesan: 'Anda belum masuk. Silakan login terlebih dahulu.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'applicant') throw new Error('role');
    req.applicantId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ pesan: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
  }
}

// Autentikasi admin (token statis dari .env)
export function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ pesan: 'Akses ditolak. Token admin tidak valid.' });
  }
  next();
}
