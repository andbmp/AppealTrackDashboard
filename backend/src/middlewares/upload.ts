import multer from 'multer';

// Menggunakan memoryStorage karena kita memproses file buffer secara langsung di RAM 
// (Menghindari penumpukan file sementara di Disk Server)
const storage = multer.memoryStorage();

// Opsi filter agar hanya file Excel yang bisa diupload (Meningkatkan Security)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file berformat Excel (.xlsx / .xls) yang diperbolehkan!'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // Batas maksimum 20MB
});

export default upload;
