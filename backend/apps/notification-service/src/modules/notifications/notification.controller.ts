import { Request, Response } from "express";
import { ApiResponse } from "@driversklub/common";

export class NotificationController {
    async sendNotification(req: Request, res: Response) {
        // Placeholder for sending notification via HTTP trigger
        const { userId, event, payload } = req.body;
        // logic to call service
        ApiResponse.send(res, 200, { success: true }, "Notification sent");
    }
}
