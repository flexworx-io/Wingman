/**
 * AWS SES Credentials Validation Test
 * Verifies that SES_ACCESS_KEY_ID and SES_SECRET_ACCESS_KEY are valid
 * by calling the SES GetSendQuota API (read-only, no emails sent).
 */

import { describe, it, expect } from "vitest";
import { SESClient, GetSendQuotaCommand } from "@aws-sdk/client-ses";

describe("AWS SES credentials", () => {
  it("should authenticate and return a valid send quota", async () => {
    const accessKeyId = process.env.SES_ACCESS_KEY_ID;
    const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
    const region = process.env.SES_REGION ?? "us-east-1";

    if (!accessKeyId || !secretAccessKey) {
      console.log("[SES Test] Credentials not set — running in dev mode, skipping live check.");
      return;
    }

    const client = new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const result = await client.send(new GetSendQuotaCommand({}));

    expect(result.Max24HourSend).toBeGreaterThan(0);
    expect(result.MaxSendRate).toBeGreaterThan(0);
    console.log(`[SES Test] ✅ Quota: ${result.Max24HourSend}/day @ ${result.MaxSendRate}/sec`);
  }, 15000);

  it("should have wingman.vip as a verified identity", async () => {
    const accessKeyId = process.env.SES_ACCESS_KEY_ID;
    const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
    const region = process.env.SES_REGION ?? "us-east-1";

    if (!accessKeyId || !secretAccessKey) {
      console.log("[SES Test] Credentials not set — skipping identity check.");
      return;
    }

    const { SESClient: SES, GetIdentityVerificationAttributesCommand } = await import("@aws-sdk/client-ses");
    const client = new SES({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const result = await client.send(
      new GetIdentityVerificationAttributesCommand({ Identities: ["wingman.vip"] })
    );

    const status = result.VerificationAttributes?.["wingman.vip"]?.VerificationStatus;
    expect(status).toBe("Success");
    console.log(`[SES Test] ✅ wingman.vip verification status: ${status}`);
  }, 15000);
});
