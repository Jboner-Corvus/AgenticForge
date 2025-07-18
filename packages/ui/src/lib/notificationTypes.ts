import {
  NotificationSchema as BaseNotificationSchema,
  ClientNotificationSchema,
  ServerNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const StdErrNotificationSchema = z.object({
  method: z.literal("notifications/stderr"),
  params: z.object({
    content: z.string(),
  }),
});

export const NotificationSchema = z.union([
  ClientNotificationSchema,
  StdErrNotificationSchema,
  ServerNotificationSchema,
  BaseNotificationSchema,
]);

export type Notification = z.infer<typeof NotificationSchema>;
export type StdErrNotification = z.infer<typeof StdErrNotificationSchema>;
