import { createProxyMiddleware, Options } from "http-proxy-middleware";
import type { Request, Response, RequestHandler } from "express";

export const createProxy = (target: string, options: Options = {}): RequestHandler => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        proxyTimeout: 30000, // 30s
        timeout: 30000,
        onError: (err: any, req: Request, res: Response) => {
            console.error(`[GATEWAY] Proxy error for ${req.url} -> ${target}:`, err.message);

            if (!res.headersSent) {
                if (err.code === 'ECONNREFUSED') {
                    res.status(503).json({
                        error: 'Service Unavailable',
                        message: 'The requested service is temporarily unavailable. Please try again.',
                        code: 'SERVICE_UNAVAILABLE'
                    });
                } else {
                    res.status(500).json({
                        error: 'Gateway Error',
                        message: 'An error occurred while processing your request.',
                        code: 'GATEWAY_ERROR'
                    });
                }
            }
        },
        ...options
    }) as RequestHandler;
};
