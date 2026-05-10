import { Router } from "express";
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase.js'; // וודא שהנתיב ל-Client של סופבייס נכון!

const storage = multer.memoryStorage(); // שינוי לזיכרון
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowedTypes.includes(file.mimetype));
    }
});

const router = Router();

// העלאת תמונה אחת
router.post('/single', upload.single('screenshot'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });

        const file = req.file;
        const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

        const { data, error } = await supabase.storage
            .from('screenshots')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('screenshots')
            .getPublicUrl(fileName);

        res.json({ url: publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// העלאת מספר תמונות
router.post('/multiple', upload.array('screenshots', 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) return res.status(400).json({ error: 'No files' });

        const uploadPromises = files.map(async (file) => {
            const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('screenshots')
                .getPublicUrl(fileName);

            return publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        res.json({ urls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Multiple upload failed' });
    }
});

export { router as uploadRoutes };