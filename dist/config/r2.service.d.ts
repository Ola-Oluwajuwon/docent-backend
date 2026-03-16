import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class R2Service implements OnModuleInit {
    private readonly configService;
    private s3;
    private bucket;
    private publicUrl;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    upload(key: string, body: Buffer | string, contentType: string): Promise<string>;
    download(key: string): Promise<Buffer>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
