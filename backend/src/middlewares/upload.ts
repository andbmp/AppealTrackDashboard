import multer from 'multer';

// Multer configured to store files temporarily in 'uploads/' directory
const upload = multer({ dest: 'uploads/' });

export default upload;
