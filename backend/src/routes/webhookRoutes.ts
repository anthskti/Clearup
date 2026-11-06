import express from "express";
import User from "../models/User";
import { reportError } from "../lib/logger";

const router = express.Router();

function isAwsSnsSubscribeUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    return u.protocol === "https:" && u.hostname.endsWith("amazonaws.com");
  } catch {
    return false;
  }
}

router.post("/aws-ses", async (req, res) => {
  try {
    const raw = typeof req.body === "string" ? req.body : String(req.body ?? "");
    const payload = JSON.parse(raw) as {
      Type?: string;
      SubscribeURL?: string;
      Message?: string;
    };

    if (payload.Type === "SubscriptionConfirmation") {
      const subscribeUrl = payload.SubscribeURL;
      if (!subscribeUrl || !isAwsSnsSubscribeUrl(subscribeUrl)) {
        req.log.warn({ event: "webhook.sns.subscription.rejected" }, "Rejected SNS subscription confirmation");
        return res.status(400).send("Bad Request");
      }
      await fetch(subscribeUrl);
      req.log.info({ event: "webhook.sns.subscription.confirmed" }, "SNS subscription confirmed");
      return res.status(200).send("OK");
    }

    if (payload.Type === "Notification" && payload.Message) {
      const message = JSON.parse(payload.Message) as {
        notificationType?: string;
        bounce?: { bouncedRecipients?: { emailAddress?: string }[] };
        complaint?: { complainedRecipients?: { emailAddress?: string }[] };
      };

      if (message.notificationType === "Bounce") {
        const recipients = message.bounce?.bouncedRecipients ?? [];
        let updated = 0;
        for (const recipient of recipients) {
          const email = recipient.emailAddress;
          if (!email) continue;
          await User.update({ emailStatus: "bounced" }, { where: { email } });
          updated += 1;
        }
        req.log.info({ event: "webhook.ses.bounce.processed", recipientCount: updated }, "Bounce notification processed");
      }

      if (message.notificationType === "Complaint") {
        const recipients = message.complaint?.complainedRecipients ?? [];
        let updated = 0;
        for (const recipient of recipients) {
          const email = recipient.emailAddress;
          if (!email) continue;
          await User.update({ emailStatus: "complained" }, { where: { email } });
          updated += 1;
        }
        req.log.info({ event: "webhook.ses.complaint.processed", recipientCount: updated }, "Complaint notification processed");
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    reportError(error, { scope: "webhook.aws_ses" }, req.log);
    return res.status(500).send("Error");
  }
});

export default router;
