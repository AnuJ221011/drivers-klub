import { Response } from "express";

export class ApiResponse {
    constructor(
        public statusCode: number,
        public data: any,
        public message: string = "Success"
    ) { }

    static send(res: Response, statusCode: number, data: any = null, message: string = "Success") {
        return res.status(statusCode).json({
            success: statusCode >= 200 && statusCode < 300,
            statusCode,
            message,
            data
        });
    }
}
