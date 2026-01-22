import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message as SQSMessage,
} from "@aws-sdk/client-sqs";
import { logger, OtpQueueMessage, AppPushQueueMessage } from "@driversklub/common";
import { OtpService } from "./otp.service";
import { PushNotifyService } from "./push.service";

export class SqsConsumer {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private otpService: OtpService;
  private pushService: PushNotifyService;
  private isPolling: boolean = false;
  private pollInterval: number = 5000; // 5 seconds

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
      logger.warn("OTP_SQS_QUEUE_URL not set. SQS consumer will not start.");
    }

    this.otpService = new OtpService();
    this.pushService = new PushNotifyService();
  }

  /**
   * Start polling SQS queue for OTP messages
   */
  async start(): Promise<void> {
    if (!this.queueUrl) {
      logger.warn(
        "SQS queue URL not configured. Skipping SQS consumer startup."
      );
      return;
    }

    if (this.isPolling) {
      logger.warn("SQS consumer is already running.");
      return;
    }

    this.isPolling = true;
    logger.info(`Starting SQS consumer for queue: ${this.queueUrl}`);

    // Start polling in the background
    this.poll();
  }

  /**
   * Stop polling SQS queue
   */
  stop(): void {
    this.isPolling = false;
    logger.info("SQS consumer stopped.");
  }

  /**
   * Poll SQS queue for messages
   */
  private async poll(): Promise<void> {
    while (this.isPolling) {
      try {
        await this.processMessages();
      } catch (error: any) {
        logger.error("Error polling SQS queue", {
          error: error.message,
          stack: error.stack,
        });
      }

      // Wait before next poll
      await this.sleep(this.pollInterval);
    }
  }

  /**
   * Receive and process messages from SQS
   */
  private async processMessages(): Promise<void> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10, // Process up to 10 messages at a time
        WaitTimeSeconds: 20, // Long polling (wait up to 20 seconds)
        MessageAttributeNames: ["All"],
      });

      const response = await this.sqsClient.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        return; // No messages, continue polling
      }

      logger.info(`Received ${response.Messages.length} message(s) from SQS`);

      // Process each message
      const promises = response.Messages.map((message: SQSMessage) =>
        this.handleMessage(message)
      );

      await Promise.allSettled(promises);
    } catch (error: any) {
      logger.error("Error receiving messages from SQS", {
        error: error.message,
        queueUrl: this.queueUrl,
      });
      throw error;
    }
  }

  /**
   * Handle individual SQS message
   */
  private async handleMessage(message: SQSMessage): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      logger.warn("Invalid SQS message: missing Body or ReceiptHandle");
      return;
    }

    try {
      // Parse message body
      const messageBody: any = JSON.parse(message.Body);

      // Check message type and route to appropriate handler
      if (messageBody.provider === "FCM_IN_APP") {
        // Handle push notification
        await this.handlePushNotification(messageBody, message.ReceiptHandle);
      } else if (messageBody.phone && messageBody.otp) {
        // Handle OTP/SMS notification
        await this.handleOtpMessage(messageBody, message.ReceiptHandle);
      } else {
        logger.warn("Unknown message format", { messageBody });
        // Delete invalid message to prevent reprocessing
        await this.deleteMessage(message.ReceiptHandle);
      }
    } catch (error: any) {
      logger.error("Error processing message", {
        error: error.message,
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle,
      });

      // Note: In production, you might want to implement dead-letter queue
      // or retry logic here. For now, we'll delete the message to prevent
      // infinite retries. Consider implementing exponential backoff or
      // moving failed messages to a DLQ.
    }
  }

  /**
   * Handle OTP/SMS message
   */
  private async handleOtpMessage(
    messageBody: OtpQueueMessage,
    receiptHandle: string
  ): Promise<void> {
    // Validate message structure
    if (!messageBody.phone || !messageBody.otp) {
      logger.warn("Invalid OTP message format", { messageBody });
      await this.deleteMessage(receiptHandle);
      return;
    }

    // Format phone number
    const formattedPhone = this.otpService.formatPhoneNumber(
      messageBody.phone
    );
    

    // Send OTP via Exotel
    await this.otpService.sendOtpViaExotel({
      phone: messageBody.phone,
      otp: messageBody.otp,
      message: messageBody.message,
    });

    logger.info(`Successfully processed OTP message for ${formattedPhone}`);

    // Delete message from queue after successful processing
    await this.deleteMessage(receiptHandle);
  }

  /**
   * Handle push notification message
   */
  private async handlePushNotification(
    messageBody: AppPushQueueMessage & { provider: string },
    receiptHandle: string
  ): Promise<void> {
    // Validate message structure
    if (
      !messageBody.userId ||
      !messageBody.fcmToken ||
      !messageBody.title ||
      !messageBody.body
    ) {
      logger.warn("Invalid push notification message format", { messageBody });
      await this.deleteMessage(receiptHandle);
      return;
    }

    // Send push notification via FCM
    await this.pushService.sendInAppFCM({
      userId: messageBody.userId,
      fcmToken: messageBody.fcmToken,
      title: messageBody.title,
      body: messageBody.body,
      data: messageBody.data,
    });

    logger.info(
      `Successfully processed push notification for user ${messageBody.userId}`
    );

    // Delete message from queue after successful processing
    await this.deleteMessage(receiptHandle);
  }

  /**
   * Delete message from SQS queue
   */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
    } catch (error: any) {
      logger.error("Error deleting message from SQS", {
        error: error.message,
        receiptHandle,
      });
      throw error;
    }
  }

  /**
   * Sleep utility for polling interval
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
