
import { Router, Request, Response } from "express";
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowedTypes.includes(file.mimetype));
    }
});

const router = Router();

// העלאת תמונה אחת
router.post('/single', upload.single('screenshot'), async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });

        const file = req.file;
        const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

        const { error } = await supabase.storage
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
router.post('/multiple', upload.array('screenshots', 10), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
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