import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed'));
        }
    },
});

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const bucketName = process.env.R2_BUCKET_NAME || 'afterhour-media';
const publicUrl = process.env.R2_PUBLIC_URL || '';

// Check R2 bucket connection at startup
export async function checkR2Connection(): Promise<boolean> {
    try {
        console.log('🔗 Checking Cloudflare R2 connection...');
        console.log(`   Bucket: ${bucketName}`);
        console.log(`   Endpoint: https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);

        const command = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(command);

        console.log('✅ R2 bucket connection successful!');
        console.log(`   Public URL: ${publicUrl}`);
        return true;
    } catch (error: any) {
        console.error('❌ R2 bucket connection failed!');
        console.error(`   Error: ${error.message}`);
        if (error.name === 'NotFound') {
            console.error('   Bucket does not exist or access denied');
        }
        return false;
    }
}

// Upload single file
router.post('/', upload.single('file'), async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const ext = file.originalname.split('.').pop() || 'jpg';
        const key = `${uuidv4()}.${ext}`;

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await s3Client.send(command);

        // Return the public URL
        const url = `${publicUrl}/${key}`;

        res.json({
            success: true,
            url,
            key,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

export default router;
