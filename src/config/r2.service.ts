import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2Service implements OnModuleInit {
  private s3!: S3Client;
  private bucket!: string;
  private publicUrl!: string;
  private readonly logger = new Logger(R2Service.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID', '');
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME', '');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    if (!accountId || accountId.includes('your-')) {
      this.logger.warn(
        'R2 credentials not configured — file operations will fail until valid values are provided in .env',
      );
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId || 'placeholder'}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async upload(
    key: string,
    body: Buffer | string,
    contentType: string,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    this.logger.log(`Uploaded file to R2: ${key}`);
    return `${this.publicUrl}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    const stream = response.Body;
    if (!stream) {
      throw new Error(`Empty response body for key: ${key}`);
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
