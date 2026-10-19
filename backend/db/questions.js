// 50 soal CBT: 17 Numerik, 17 Literasi, 16 Kemampuan Berpikir
// Format: [kategori, pertanyaan, A, B, C, D, jawabanBenar]
const N = 'Numerik';
const L = 'Literasi';
const K = 'Kemampuan Berpikir';

const rows = [
  // ===== NUMERIK (1-17) =====
  [N, '25% dari 240 adalah ...', '50', '60', '70', '80', 'B'],
  [N, 'Lanjutan deret 2, 6, 18, 54, ... adalah ...', '108', '162', '148', '216', 'B'],
  [N, 'Hasil dari 3/4 + 2/5 adalah ...', '23/20', '5/9', '11/20', '6/5', 'A'],
  [N, 'Sebuah mobil melaju 60 km/jam. Waktu yang dibutuhkan untuk menempuh 150 km adalah ...', '2 jam', '2,25 jam', '2,5 jam', '3 jam', 'C'],
  [N, 'Rata-rata dari nilai 70, 80, 90, dan 60 adalah ...', '70', '75', '80', '72,5', 'B'],
  [N, '15% dari 200 ditambah 20% dari 150 sama dengan ...', '50', '55', '60', '65', 'C'],
  [N, 'Lanjutan deret 1, 4, 9, 16, 25, ... adalah ...', '36', '30', '32', '49', 'A'],
  [N, 'Jika 5x - 7 = 18, maka nilai x adalah ...', '3', '4', '6', '5', 'D'],
  [N, 'Sebuah barang seharga Rp80.000 didiskon 25%. Harga yang harus dibayar adalah ...', 'Rp60.000', 'Rp55.000', 'Rp65.000', 'Rp20.000', 'A'],
  [N, 'Perbandingan umur ayah dan anak adalah 5 : 2 dengan jumlah umur 56 tahun. Umur anak adalah ...', '12 tahun', '16 tahun', '20 tahun', '24 tahun', 'B'],
  [N, 'Hasil dari 12 × 15 ÷ 6 adalah ...', '20', '25', '30', '36', 'C'],
  [N, 'Luas persegi panjang dengan panjang 14 cm dan lebar 9 cm adalah ...', '46 cm²', '63 cm²', '116 cm²', '126 cm²', 'D'],
  [N, 'Lanjutan deret 5, 8, 14, 26, 50, ... adalah ...', '74', '98', '100', '96', 'B'],
  [N, 'Enam pekerja menyelesaikan suatu proyek dalam 10 hari. Jika dikerjakan 4 pekerja dengan kecepatan sama, proyek selesai dalam ...', '15 hari', '12 hari', '14 hari', '16 hari', 'A'],
  [N, 'Hasil dari √144 + 3² adalah ...', '15', '18', '21', '24', 'C'],
  [N, 'Peluang munculnya angka genap pada pelemparan satu dadu bersisi enam adalah ...', '1/3', '1/2', '2/3', '1/6', 'B'],
  [N, 'Tabungan Rp500.000 berbunga tunggal 10% per tahun. Total tabungan setelah 2 tahun adalah ...', 'Rp550.000', 'Rp560.000', 'Rp650.000', 'Rp600.000', 'D'],

  // ===== LITERASI (18-34) =====
  [L, 'Sinonim kata "efektif" adalah ...', 'berhasil guna', 'boros', 'lambat', 'rumit', 'A'],
  [L, 'Antonim kata "transparan" adalah ...', 'terbuka', 'jernih', 'buram', 'tembus pandang', 'C'],
  [L, 'Kalimat yang efektif adalah ...', 'Para peserta-peserta hadir tepat waktu.', 'Para peserta hadir tepat waktu.', 'Banyak para peserta hadir tepat waktu.', 'Peserta-peserta para hadir tepat waktu.', 'B'],
  [L, 'Penulisan kata baku yang benar adalah ...', 'Praktek', 'Praktik', 'Prakteck', 'Praktyk', 'B'],
  [L, 'Bacalah teks berikut.\n"Pendidikan merupakan investasi jangka panjang. Hasilnya tidak terlihat dalam waktu singkat, tetapi dampaknya dirasakan lintas generasi."\n\nIde pokok teks tersebut adalah ...', 'Hasil pendidikan terlihat dalam waktu singkat.', 'Pendidikan adalah investasi jangka panjang yang dampaknya lintas generasi.', 'Pendidikan tidak penting bagi generasi muda.', 'Investasi hanya dapat dilakukan lewat pendidikan.', 'B'],
  [L, 'Bacalah teks berikut.\n"Minat baca masyarakat dinilai masih rendah, antara lain karena akses terhadap buku terbatas dan budaya membaca belum dibentuk sejak dini."\n\nPenyebab rendahnya minat baca menurut teks adalah ...', 'Harga buku yang terlalu murah', 'Banyaknya perpustakaan digital', 'Akses buku terbatas dan budaya membaca belum terbentuk sejak dini', 'Kurangnya penerbit buku di dunia', 'C'],
  [L, 'Bacalah teks berikut.\n"Sampah plastik mencemari laut. Hewan laut menelan plastik tersebut. Akibatnya, rantai makanan terganggu."\n\nKesimpulan yang tepat adalah ...', 'Hewan laut menyukai plastik.', 'Laut tidak terpengaruh oleh sampah.', 'Sampah plastik di laut dapat mengganggu ekosistem.', 'Rantai makanan tidak berhubungan dengan sampah.', 'C'],
  [L, 'Kata "ambigu" memiliki makna ...', 'jelas dan tegas', 'bermakna ganda', 'sangat panjang', 'tidak bermakna', 'B'],
  [L, 'Kalimat dengan tanda baca yang tepat adalah ...', 'Ibu membeli apel jeruk dan mangga.', 'Ibu membeli apel, jeruk, dan mangga.', 'Ibu, membeli apel jeruk, dan mangga.', 'Ibu membeli, apel jeruk dan, mangga.', 'B'],
  [L, 'Awalan pe- pada kata "pengajar" menyatakan makna ...', 'pelaku', 'alat', 'hasil', 'tempat', 'A'],
  [L, 'Ungkapan "ujung tombak" dalam kalimat "Guru adalah ujung tombak pendidikan" bermakna ...', 'alat tajam', 'garda terdepan', 'penghalang', 'pekerjaan ringan', 'B'],
  [L, 'Kalimat "Waktu adalah pedang" menggunakan majas ...', 'hiperbola', 'metafora', 'personifikasi', 'ironi', 'B'],
  [L, 'Kata penghubung yang tepat: "Ia terlambat ... hujan deras."', 'karena', 'tetapi', 'sehingga', 'agar', 'A'],
  [L, 'Bacalah teks berikut.\n"Seluruh peserta wajib membawa kartu identitas. Tanpa kartu tersebut, peserta tidak diperkenankan memasuki ruang ujian. Rina tidak membawa kartu identitas."\n\nSimpulan yang tepat adalah ...', 'Rina boleh masuk ruang ujian.', 'Rina tidak diperkenankan memasuki ruang ujian.', 'Rina bukan peserta.', 'Kartu identitas tidak wajib.', 'B'],
  [L, '"Meski hujan deras, Dito tetap berangkat mengajar anak-anak di desa."\n\nSikap Dito yang tergambar adalah ...', 'pemalas', 'berdedikasi', 'ragu-ragu', 'acuh tak acuh', 'B'],
  [L, 'Kalimat yang TIDAK baku adalah ...', 'Saya sudah mengumpulkan tugas.', 'Dia mengerjain tugas sendiri.', 'Kami berdiskusi di perpustakaan.', 'Mereka mengikuti seleksi.', 'B'],
  [L, 'Bacalah teks berikut.\n"Sekelompok mahasiswa relawan menghabiskan satu bulan mengajar di sekolah dasar pedesaan, mulai dari membaca hingga sains sederhana."\n\nJudul yang paling tepat adalah ...', 'Harga Buku Pelajaran Naik', 'Mahasiswa Relawan Mengajar di Sekolah Desa', 'Wisata Alam Pedesaan', 'Cara Membuat Eksperimen Sains', 'B'],

  // ===== KEMAMPUAN BERPIKIR (35-50) =====
  [K, 'Semua pengajar bersikap sabar. Budi adalah pengajar. Maka ...', 'Budi bersikap sabar.', 'Budi tidak sabar.', 'Budi bukan pengajar.', 'Semua orang sabar.', 'A'],
  [K, 'Semua mahasiswa memiliki NIM. Sinta memiliki NIM. Maka ...', 'Sinta pasti mahasiswa.', 'Sinta bukan mahasiswa.', 'Belum tentu Sinta mahasiswa.', 'Sinta tidak memiliki NIM.', 'C'],
  [K, 'Lanjutan pola A, C, E, G, ... adalah ...', 'H', 'I', 'J', 'K', 'B'],
  [K, 'Dokter : Rumah Sakit = Guru : ...', 'Buku', 'Murid', 'Sekolah', 'Ijazah', 'C'],
  [K, 'Andi lebih tinggi dari Budi. Budi lebih tinggi dari Citra. Siapa yang paling pendek?', 'Andi', 'Budi', 'Citra', 'Tidak dapat ditentukan', 'C'],
  [K, 'Jika hari ini Senin, maka 100 hari lagi adalah hari ...', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'B'],
  [K, 'Jika hujan, maka jalan basah. Jalan tidak basah. Kesimpulannya ...', 'Hujan turun.', 'Tidak hujan.', 'Jalan kering karena hujan.', 'Tidak dapat disimpulkan.', 'B'],
  [K, 'Lanjutan pola Z, X, V, T, ... adalah ...', 'S', 'R', 'Q', 'P', 'B'],
  [K, 'Jika KAMU ditulis LBNV, maka BUKU ditulis ...', 'CVLV', 'CULU', 'CVKV', 'DVLV', 'A'],
  [K, 'Lima orang saling berjabat tangan, masing-masing pasangan tepat satu kali. Banyak jabat tangan adalah ...', '5', '10', '15', '20', 'B'],
  [K, 'Kata yang tidak sejenis dengan lainnya adalah ...', 'Apel', 'Jeruk', 'Wortel', 'Mangga', 'C'],
  [K, 'Jika 5 mesin membuat 5 produk dalam 5 menit, berapa menit yang dibutuhkan 100 mesin untuk membuat 100 produk?', '1 menit', '5 menit', '20 menit', '100 menit', 'B'],
  [K, 'Besar sudut terkecil antara jarum jam dan jarum menit pada pukul 03.00 adalah ...', '60°', '75°', '90°', '120°', 'C'],
  [K, 'Tugas A harus sebelum B. Tugas C dikerjakan setelah B. Tugas D dikerjakan sebelum A. Urutan yang benar adalah ...', 'A, B, C, D', 'D, A, B, C', 'D, B, A, C', 'C, D, A, B', 'B'],
  [K, 'Kubus berusuk 3 cm dicat seluruh permukaannya, lalu dipotong menjadi kubus kecil berusuk 1 cm. Banyak kubus kecil yang tepat 2 sisinya tercat adalah ...', '8', '12', '6', '1', 'B'],
  [K, 'Semua A adalah B. Sebagian B adalah C. Kesimpulan yang pasti benar adalah ...', 'Semua A adalah C.', 'Sebagian A adalah C.', 'Tidak ada A yang C.', 'Hubungan antara A dan C tidak dapat disimpulkan dengan pasti.', 'D'],
];

if (rows.length !== 50) throw new Error(`Jumlah soal harus 50, saat ini ${rows.length}`);

export const questions = rows.map(([kategori, pertanyaan, a, b, c, d, benar], i) => ({
  nomor: i + 1,
  kategori,
  pertanyaan,
  opsi_a: a,
  opsi_b: b,
  opsi_c: c,
  opsi_d: d,
  jawaban_benar: benar,
}));
