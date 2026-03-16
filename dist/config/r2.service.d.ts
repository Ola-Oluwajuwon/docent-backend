import { ConfigService } from '@nestjs/config';
export declare class R2Service {
    private readonly configService;
    private readonly s3;
    private readonly bucket;
    private readonly publicUrl;
    private readonly logger;
    constructor(configService: ConfigService);
    upload(key: string, body: Buffer | string, contentType: string): Promise<string>;
    download(key: string): Promise<Buffer>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
