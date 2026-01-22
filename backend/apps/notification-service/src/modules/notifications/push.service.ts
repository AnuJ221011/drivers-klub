import admin from "firebase-admin";
import { logger } from "@driversklub/common";

// Initialize Firebase Admin if not already initialized
// if (!admin.apps.length) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert(
//         JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")
//       ),
//     });
//   } catch (error: any) {
//     logger.error("Failed to initialize Firebase Admin", {
//       error: error.message,
//     });
//   }
// }

export interface AppPushRequest {
  userId: string;
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushNotifyService {
  async sendInAppFCM(request: AppPushRequest): Promise<boolean> {
    try {
      // Validate FCM token
      if (!request.fcmToken) {
        throw new Error("FCM token is required");
      }

      // Convert data object to string key-value pairs (FCM requirement)
      const dataPayload = request.data
        ? Object.fromEntries(
            Object.entries(request.data).map(([k, v]) => [k, String(v)])
          )
        : undefined;

      // Send FCM message
      const message = {
        token: request.fcmToken,
        notification: {
          title: request.title,
          body: request.body,
        },
        ...(dataPayload && { data: dataPayload }),
      };

      const response = await admin.messaging().send(message);

      logger.info(`FCM notification sent successfully`, {
        userId: request.userId,
        messageId: response,
      });

      return true;
    } catch (error: any) {
      logger.error(`Failed to send FCM notification`, {
        userId: request.userId,
        error: error.message,
        code: error.code,
      });
      throw new Error(`FCM notification send failed: ${error.message}`);
    }
  }
}
