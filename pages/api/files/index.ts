// pages/api/files/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserFromRequest } from '@/utils/auth';
import { r2 } from '@/utils/r2';
import formidable from 'formidable';
import fs from 'fs/promises';

// Nonaktifkan body parser bawaan Next.js untuk menangani multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const bucketName = process.env.R2_BUCKET_NAME || '';

  if (req.method === 'POST') {
    // Create: Unggah file ke R2
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Failed to parse file' });

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const fileContent = await fs.readFile(file.filepath);
      const key = `uploads/${user.userId}/${file.originalFilename}`; // Struktur folder berdasarkan userId

      try {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: file.mimetype || 'application/octet-stream',
        });
        await r2.send(command);
        res.status(200).json({ message: 'File uploaded', key });
      } catch (error) {
        res.status(500).json({ error: 'Failed to upload file' });
      }
    });
  } else if (req.method === 'GET') {
    // Read: Daftar file atau dapatkan URL file
    const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    if (key) {
      // Dapatkan pre-signed URL untuk mengakses file
      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        const url = await getSignedUrl(r2, command, { expiresIn: 3600 }); // URL berlaku 1 jam
        res.status(200).json({ url });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get file URL' });
      }
    } else {
      // Daftar semua file pengguna
      try {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: `uploads/${user.userId}/`,
        });
        const result = await r2.send(command);
        const files = result.Contents?.map((item) => ({
          key: item.Key,
          lastModified: item.LastModified,
          size: item.Size,
        })) || [];
        res.status(200).json(files);
      } catch (error) {
        res.status(500).json({ error: 'Failed to list files' });
      }
    }
  } else if (req.method === 'PUT') {
    // Update: Ganti file yang ada
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Failed to parse file' });

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const key = Array.isArray(fields.key) ? fields.key[0] : fields.key;
      if (!file || !key) return res.status(400).json({ error: 'File and key required' });

      const fileContent = await fs.readFile(file.filepath);

      try {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: file.mimetype || 'application/octet-stream',
        });
        await r2.send(command);
        res.status(200).json({ message: 'File updated', key });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
      }
    });
  } else if (req.method === 'DELETE') {
    // Delete: Hapus file dari R2
    const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    if (!key) return res.status(400).json({ error: 'Key required' });

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await r2.send(command);
      res.status(200).json({ message: 'File deleted' });
    } catch (error) {
      console.log(error);

      res.status(500).json({ error: 'Failed to delete file' });
    }
  } else {
    res.status(405).end();
  }
}