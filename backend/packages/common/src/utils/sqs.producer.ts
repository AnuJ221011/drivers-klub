import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { logger } from "./logger";

export interface OtpQueueMessage {
  phone: string;
  otp: string;
  message?: string;
}

export interface AppPushQueueMessage {
  userId: string;
  fcmToken: string;
  title: string;
  body: string;
  data: object;
}

export class SqsProducer {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor() {
    // Initialize SQS Client
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

    // Get queue URL from environment
    this.queueUrl = process.env.NOTIFY_SQS_QUEUE_URL || "";
    if (!this.queueUrl) {
      logger.warn("NOTIFY_SQS_QUEUE_URL not set. SQS producer will not work.");
    }
  }

  /**
   * Send OTP message to SQS queue
   */
  async sendOtpMessage(message: OtpQueueMessage): Promise<boolean> {
    if (!this.queueUrl) {
      throw new Error("NOTIFY_SQS_QUEUE_URL is not configured");
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          phone: {
            DataType: "String",
            StringValue: message.phone,
          },
          type: {
            DataType: "String",
            StringValue: "OTP",
          },
        },
      });

      const response = await this.sqsClient.send(command);

      logger.info(`OTP message sent to SQS queue`, {
        messageId: response.MessageId,
        phone: message.phone,
      });

      return true;
    } catch (error: any) {
      logger.error("Error sending OTP message to SQS", {
        error: error.message,
        phone: message.phone,
      });
      throw error;
    }
  }

  /**
   * Send App push notification message to SQS queue
   */
  async sendInAppPush(message: AppPushQueueMessage): Promise<boolean> {
    if (!this.queueUrl) {
      throw new Error("NOTIFY_SQS_QUEUE_URL is not configured");
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify({
          ...message,
          provider: "FCM_IN_APP",
        }),
      });

      const response = await this.sqsClient.send(command);

      logger.info(`App Notification message sent to SQS queue`, {
        messageId: response.MessageId,
      });

      return true;
    } catch (error: any) {
      logger.error("Error sending App Notification message to SQS", {
        error: error.message,
      });
      throw error;
    }
  }
}
