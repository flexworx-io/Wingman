/**
 * Wingman Transactional Email Service — AWS SES
 * Uses @aws-sdk/client-ses with credentials from environment variables.
 *
 * Required env vars (set via webdev_request_secrets):
 *   SES_ACCESS_KEY_ID     — IAM access key (note: NOT prefixed with AWS_)
 *   SES_SECRET_ACCESS_KEY — IAM secret key
 *   SES_REGION            — AWS region (e.g. us-east-1)
 *   SES_FROM_EMAIL        — Verified sender (e.g. noreply@wingman.vip)
 *
 * Falls back to console logging in dev mode when credentials are not set.
 */

import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from "@aws-sdk/client-ses";

function getSesClient(): SESClient | null {
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  const region = process.env.SES_REGION ?? "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    return null; // dev mode
  }

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "Wingman <noreply@wingman.vip>";
const APP_NAME = "Wingman";

// ─── Shared HTML shell ────────────────────────────────────────────────────────
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
    .container { max-width: 560px; margin: 40px auto; background: #111128; border-radius: 16px; overflow: hidden; border: 1px solid rgba(124,58,237,0.2); }
    .header { background: linear-gradient(135deg, #4c1d95, #7c3aed); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.7); font-size: 14px; }
    .body { padding: 40px; }
    .body h2 { margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #f1f5f9; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #94a3b8; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 8px 0 24px; }
    .code { display: inline-block; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.4); border-radius: 8px; padding: 12px 24px; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #a78bfa; margin: 12px 0 24px; font-family: monospace; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0; }
    .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #475569; }
    .footer a { color: #7c3aed; text-decoration: none; }
    .warning { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #fca5a5; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ ${APP_NAME}</h1>
      <p>Your AI Social Wingman</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email types ──────────────────────────────────────────────────────────────
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devMode?: boolean;
}

// ─── Core send function ───────────────────────────────────────────────────────
async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const client = getSesClient();

  if (!client) {
    // Dev mode — log to console
    console.log("\n📧 [EMAIL DEV MODE — AWS SES not configured] ─────────────");
    console.log(`To: ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Text: ${opts.text ?? "(html only)"}`);
    console.log("─────────────────────────────────────────────────────────\n");
    return { success: true, messageId: `dev_${Date.now()}`, devMode: true };
  }

  const input: SendEmailCommandInput = {
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [opts.to] },
    Message: {
      Subject: { Data: opts.subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: opts.html, Charset: "UTF-8" },
        ...(opts.text ? { Text: { Data: opts.text, Charset: "UTF-8" } } : {}),
      },
    },
  };

  try {
    const result = await client.send(new SendEmailCommand(input));
    console.log(`[Email] SES sent to ${opts.to} — MessageId: ${result.MessageId}`);
    return { success: true, messageId: result.MessageId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown SES error";
    console.error("[Email] SES send failed:", message);
    return { success: false, error: message };
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

/**
 * Send email verification link
 */
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  verificationUrl: string;
  expiresInHours?: number;
}): Promise<SendEmailResult> {
  const { to, name, verificationUrl, expiresInHours = 24 } = opts;

  const html = emailShell(`
    <h2>Verify your email address</h2>
    <p>Hi ${name},</p>
    <p>Welcome to ${APP_NAME}! Click the button below to verify your email address and start forging your Wingman.</p>
    <a href="${verificationUrl}" class="btn">✅ Verify Email Address</a>
    <p style="font-size:13px;color:#64748b;">Or copy and paste this link into your browser:</p>
    <p style="font-size:12px;color:#7c3aed;word-break:break-all;">${verificationUrl}</p>
    <hr class="divider" />
    <div class="warning">⏱ This link expires in ${expiresInHours} hours. If you didn't create a ${APP_NAME} account, you can safely ignore this email.</div>
  `);

  return sendEmail({
    to,
    subject: `Verify your ${APP_NAME} email address`,
    html,
    text: `Hi ${name},\n\nVerify your email: ${verificationUrl}\n\nThis link expires in ${expiresInHours} hours.`,
  });
}

/**
 * Send password reset link
 */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
  expiresInHours?: number;
}): Promise<SendEmailResult> {
  const { to, name, resetUrl, expiresInHours = 2 } = opts;

  const html = emailShell(`
    <h2>Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your ${APP_NAME} password. Click the button below to choose a new password.</p>
    <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
    <p style="font-size:13px;color:#64748b;">Or copy and paste this link into your browser:</p>
    <p style="font-size:12px;color:#7c3aed;word-break:break-all;">${resetUrl}</p>
    <hr class="divider" />
    <div class="warning">⏱ This link expires in ${expiresInHours} hours. If you didn't request a password reset, please ignore this email — your password will remain unchanged.</div>
  `);

  return sendEmail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html,
    text: `Hi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in ${expiresInHours} hours.`,
  });
}

/**
 * Send welcome email after account activation
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  wingmanName: string;
  dashboardUrl: string;
}): Promise<SendEmailResult> {
  const { to, name, wingmanName, dashboardUrl } = opts;

  const html = emailShell(`
    <h2>⚡ ${wingmanName} is live!</h2>
    <p>Hi ${name},</p>
    <p>Your AI Wingman <strong style="color:#a78bfa">${wingmanName}</strong> has been forged and is ready to start making connections for you.</p>
    <p>Head to your dashboard to see who ${wingmanName} has found for you.</p>
    <a href="${dashboardUrl}" class="btn">🚀 Open Dashboard</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#64748b;">Your Wingman works 24/7 — discovering compatible people, preparing conversation starters, and building your social world while you live your life.</p>
  `);

  return sendEmail({
    to,
    subject: `${wingmanName} is ready — your Wingman is live!`,
    html,
    text: `Hi ${name},\n\nYour Wingman ${wingmanName} is live! Visit your dashboard: ${dashboardUrl}`,
  });
}

/**
 * Send organization invite email
 */
export async function sendOrgInviteEmail(opts: {
  to: string;
  inviterName: string;
  orgName: string;
  inviteUrl: string;
  expiresInDays?: number;
}): Promise<SendEmailResult> {
  const { to, inviterName, orgName, inviteUrl, expiresInDays = 7 } = opts;

  const html = emailShell(`
    <h2>You've been invited to ${orgName}</h2>
    <p><strong style="color:#a78bfa">${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ${APP_NAME}.</p>
    <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    <hr class="divider" />
    <div class="warning">⏱ This invitation expires in ${expiresInDays} days.</div>
  `);

  return sendEmail({
    to,
    subject: `${inviterName} invited you to ${orgName} on ${APP_NAME}`,
    html,
    text: `${inviterName} invited you to ${orgName}. Accept: ${inviteUrl}`,
  });
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionEmail(opts: {
  to: string;
  name: string;
  planName: string;
  amount: string;
  nextBillingDate: string;
  dashboardUrl: string;
}): Promise<SendEmailResult> {
  const { to, name, planName, amount, nextBillingDate, dashboardUrl } = opts;

  const html = emailShell(`
    <h2>Subscription Confirmed</h2>
    <p>Hi ${name},</p>
    <p>Your <strong style="color:#a78bfa">${planName}</strong> subscription is now active.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Plan</td>
        <td style="padding:8px 0;color:#e2e8f0;font-size:14px;text-align:right;font-weight:600;">${planName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Amount</td>
        <td style="padding:8px 0;color:#e2e8f0;font-size:14px;text-align:right;font-weight:600;">${amount}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">Next billing</td>
        <td style="padding:8px 0;color:#e2e8f0;font-size:14px;text-align:right;font-weight:600;">${nextBillingDate}</td>
      </tr>
    </table>
    <a href="${dashboardUrl}" class="btn">View Dashboard</a>
  `);

  return sendEmail({
    to,
    subject: `${APP_NAME} ${planName} — subscription confirmed`,
    html,
    text: `Hi ${name},\n\nYour ${planName} subscription is active. Amount: ${amount}. Next billing: ${nextBillingDate}.\n\nDashboard: ${dashboardUrl}`,
  });
}

/**
 * Send panic alert email to trust contacts
 */
export async function sendPanicAlertEmail(opts: {
  to: string;
  contactName: string;
  userName: string;
  location?: string;
  timestamp: string;
}): Promise<SendEmailResult> {
  const { to, contactName, userName, location, timestamp } = opts;

  const html = emailShell(`
    <h2 style="color:#ef4444;">🚨 Safety Alert — ${userName} needs help</h2>
    <p>Hi ${contactName},</p>
    <p><strong style="color:#a78bfa">${userName}</strong> has activated Panic Mode on ${APP_NAME} and listed you as a trusted contact.</p>
    ${location ? `<p><strong>Last known location:</strong> ${location}</p>` : ""}
    <p><strong>Time:</strong> ${timestamp}</p>
    <div class="warning">Please try to contact ${userName} immediately. If you cannot reach them, consider contacting local emergency services.</div>
  `);

  return sendEmail({
    to,
    subject: `🚨 SAFETY ALERT: ${userName} needs help`,
    html,
    text: `SAFETY ALERT: ${userName} has activated Panic Mode on ${APP_NAME}.\n\nPlease contact them immediately.\n${location ? `Last known location: ${location}\n` : ""}Time: ${timestamp}`,
  });
}
