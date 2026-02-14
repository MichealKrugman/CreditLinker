import * as Minio from 'minio'

// Initialize MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'creditlink_minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'creditlink_minio_secret_key_2024',
})

const bucketName = process.env.MINIO_BUCKET_NAME || 'creditlink-documents'

/**
 * Initialize MinIO bucket if it doesn't exist
 */
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(bucketName)
    
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1')
      console.log(`✅ Created MinIO bucket: ${bucketName}`)
      
      // Set bucket policy to allow read access to uploaded files
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      }
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
    }
  } catch (error) {
    console.error('MinIO bucket initialization error:', error)
    throw error
  }
}

/**
 * Upload a file to MinIO
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const objectName = `uploads/${Date.now()}-${fileName}`
    
    await minioClient.putObject(
      bucketName,
      objectName,
      file,
      file.length,
      {
        'Content-Type': contentType,
      }
    )

    // Return the file path
    return objectName
  } catch (error) {
    console.error('MinIO upload error:', error)
    throw new Error('Failed to upload file')
  }
}

/**
 * Get a file from MinIO
 */
export async function getFile(filePath: string): Promise<Buffer> {
  try {
    const chunks: Buffer[] = []
    const stream = await minioClient.getObject(bucketName, filePath)

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('MinIO get file error:', error)
    throw new Error('Failed to retrieve file')
  }
}

/**
 * Delete a file from MinIO
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, filePath)
  } catch (error) {
    console.error('MinIO delete error:', error)
    throw new Error('Failed to delete file')
  }
}

/**
 * Get a presigned URL for file download (valid for 24 hours)
 */
export async function getDownloadUrl(filePath: string): Promise<string> {
  try {
    return await minioClient.presignedGetObject(bucketName, filePath, 24 * 60 * 60)
  } catch (error) {
    console.error('MinIO presigned URL error:', error)
    throw new Error('Failed to generate download URL')
  }
}

/**
 * List all files in a directory
 */
export async function listFiles(prefix: string = 'uploads/'): Promise<string[]> {
  try {
    const stream = minioClient.listObjectsV2(bucketName, prefix, true)
    const files: string[] = []

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) files.push(obj.name)
      })
      stream.on('end', () => resolve(files))
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('MinIO list files error:', error)
    throw new Error('Failed to list files')
  }
}

export { minioClient, bucketName }
