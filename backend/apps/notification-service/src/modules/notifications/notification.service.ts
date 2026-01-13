import { Server, Socket } from "socket.io";
import { logger } from "@driversklub/common";

export class NotificationService {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    public notifyUser(userId: string, event: string, payload: any) {
        logger.info(`Sending notification to user ${userId}: ${event}`, payload);
        this.io.to(userId).emit(event, payload);
    }

    public notifyDriver(driverId: string, event: string, payload: any) {
        logger.info(`Sending notification to driver ${driverId}: ${event}`, payload);
        this.io.to(driverId).emit(event, payload);
    }

    public broadcast(event: string, payload: any) {
        logger.info(`Broadcasting notification: ${event}`, payload);
        this.io.emit(event, payload);
    }
}
