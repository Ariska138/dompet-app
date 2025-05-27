import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserFromRequest } from '@/utils/auth';
import { r2 } from '@/utils/r2';
import formidable from 'formidable';
import fs from 'fs/promises';
import sharp from 'sharp';
import { db } from '@/src/db';
import { files as filesTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, formFiles) => {
      if (err) return res.status(500).json({ error: 'Failed to parse file' });

      const file = Array.isArray(formFiles.file) ? formFiles.file[0] : formFiles.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      let fileContent = await fs.readFile(file.filepath);
      let contentType = file.mimetype || 'application/octet-stream';

      // Compress image if it's an image
      if (contentType.startsWith('image/')) {
        fileContent = await sharp(fileContent)
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        contentType = 'image/jpeg';
      }

      const key = `uploads/${user.userId}/${file.originalFilename}`;

      try {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: contentType,
        });
        await r2.send(command);

        // Save metadata to database
        await db.insert(filesTable).values({
          userId: user.userId,
          key,
          filename: file.originalFilename || 'unknown',
          contentType,
          size: fileContent.length,
        });

        res.status(200).json({ message: 'File uploaded', key });
      } catch (error) {
        res.status(500).json({ error: 'Failed to upload file' });
      }
    });
  } else if (req.method === 'GET') {
    const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    if (key) {
      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
        res.status(200).json({ url });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get file URL' });
      }
    } else {
      try {
        const result = await db.select().from(filesTable).where(eq(filesTable.userId, user.userId));
        const fileList = result.map((item) => ({
          key: item.key,
          lastModified: item.createdAt,
          size: item.size,
        }));
        res.status(200).json(fileList);
      } catch (error) {
        res.status(500).json({ error: 'Failed to list files' });
      }
    }
  } else if (req.method === 'PUT') {
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, formFiles) => {
      if (err) return res.status(500).json({ error: 'Failed to parse file' });

      const file = Array.isArray(formFiles.file) ? formFiles.file[0] : formFiles.file;
      const key = Array.isArray(fields.key) ? fields.key[0] : fields.key;
      if (!file || !key) return res.status(400).json({ error: 'File and key required' });

      let fileContent = await fs.readFile(file.filepath);
      let contentType = file.mimetype || 'application/octet-stream';

      if (contentType.startsWith('image/')) {
        fileContent = await sharp(fileContent)
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        contentType = 'image/jpeg';
      }

      try {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: contentType,
        });
        await r2.send(command);

        // Update metadata
        await db.update(filesTable)
          .set({ filename: file.originalFilename || 'unknown', contentType, size: fileContent.length })
          .where(eq(filesTable.key, key));

        res.status(200).json({ message: 'File updated', key });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
      }
    });
  } else if (req.method === 'DELETE') {
    const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
    if (!key) return res.status(400).json({ error: 'Key required' });

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await r2.send(command);

      // Delete metadata
      await db.delete(filesTable).where(eq(filesTable.key, key));

      res.status(200).json({ message: 'File deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  } else {
    res.status(405).end();
  }
}
