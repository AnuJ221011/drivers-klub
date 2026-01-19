import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Validate Environment Variables
const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION,
    AWS_S3_BUCKET_NAME
} = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_DEFAULT_REGION || !AWS_S3_BUCKET_NAME) {
    console.warn("⚠️ AWS S3 credentials missing. S3 Service will fail if used.");
}

const s3Client = new S3Client({
    region: AWS_DEFAULT_REGION || "ap-south-1",
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || "",
        secretAccessKey: AWS_SECRET_ACCESS_KEY || ""
    }
});

export const S3Service = {
    /**
     * Generate a presigned URL for uploading a file to S3
     * @param folder Folder name (e.g., 'selfies', 'odometer', 'documents')
     * @param contentType MIME type of the file (e.g., 'image/jpeg')
     * @returns { uploadUrl, key, url }
     */
    async getPresignedUrl(folder: string, contentType: string) {
        if (!AWS_S3_BUCKET_NAME) {
            throw new Error("AWS_S3_BUCKET_NAME is not configured");
        }

        const allowedFolders = ['selfies', 'odometer', 'documents', 'profiles', 'vehicles'];
        if (!allowedFolders.includes(folder)) {
            throw new Error(`Invalid folder. Allowed: ${allowedFolders.join(', ')}`);
        }

        const extension = contentType.split('/')[1] || 'jpg';
        const key = `${folder}/${uuidv4()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

        return {
            uploadUrl,
            key,
            // Construct the final public URL (assuming public read or needing CloudFront in future)
            // For now, standard S3 URL
            url: `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_DEFAULT_REGION}.amazonaws.com/${key}`
        };
    }
};
