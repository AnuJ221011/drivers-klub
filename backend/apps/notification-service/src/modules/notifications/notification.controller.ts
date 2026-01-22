import { Request, Response } from "express";
import { ApiResponse } from "@driversklub/common";
import { OtpService } from "./otp.service";

export class NotificationController {
    private otpService: OtpService;

  constructor() {
    this.otpService = new OtpService();
  }

    async sendNotification(req: Request, res: Response) {
        // Placeholder for sending notification via HTTP trigger
        const { userId: _userId, event: _event, payload: _payload } = req.body;
        // logic to call service
        ApiResponse.send(res, 200, { success: true }, "Notification sent");
    }
}