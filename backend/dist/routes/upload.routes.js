import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
    },
});
const router = Router();
// העלאת תמונה אחת
router.post('/single', upload.single('screenshot'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file' });
    res.json({ url: `/uploads/${req.file.filename}` });
});
// העלאת מספר תמונות
router.post('/multiple', upload.array('screenshots', 10), (req, res) => {
    const files = req.files;
    if (!files || files.length === 0)
        return res.status(400).json({ error: 'No files' });
    const urls = files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
});
export { router as uploadRoutes };
