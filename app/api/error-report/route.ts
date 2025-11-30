import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/libs/resend";
import config from "@/config";

interface ErrorReportPayload {
  type: "error" | "not-found";
  email?: string;
  additionalInfo?: string;
  context: {
    url: string;
    referrer: string;
    userAgent: string;
    timestamp: string;
    errorMessage?: string;
    errorStack?: string;
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildErrorReportEmail(payload: ErrorReportPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const { type, email, additionalInfo, context } = payload;
  const isNotFound = type === "not-found";

  const subject = isNotFound
    ? `[ViaProto] 404 Not Found: ${context.url}`
    : `[ViaProto] Error Report: ${context.errorMessage?.slice(0, 50) || "Unknown error"}`;

  const textParts = [
    `Error Type: ${isNotFound ? "404 Not Found" : "Application Error"}`,
    `URL: ${context.url}`,
    `Referrer: ${context.referrer}`,
    `Timestamp: ${context.timestamp}`,
    `User Agent: ${context.userAgent}`,
    "",
  ];

  if (email) {
    textParts.push(`Reporter Email: ${email}`);
  }

  if (additionalInfo) {
    textParts.push(`Additional Info: ${additionalInfo}`);
  }

  if (context.errorMessage) {
    textParts.push("", `Error Message: ${context.errorMessage}`);
  }

  if (context.errorStack) {
    textParts.push("", "Stack Trace:", context.errorStack);
  }

  const text = textParts.join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: ${isNotFound ? "#fef3c7" : "#fee2e2"};
      border-left: 4px solid ${isNotFound ? "#f59e0b" : "#dc2626"};
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .header h2 {
      margin: 0;
      color: ${isNotFound ? "#92400e" : "#991b1b"};
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field {
      margin-bottom: 12px;
    }
    .field-label {
      font-weight: 500;
      color: #6b7280;
      font-size: 13px;
    }
    .field-value {
      color: #111827;
      word-break: break-all;
    }
    .code-block {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .reporter-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .user-message {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 12px;
      border-radius: 6px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${isNotFound ? "404 Page Not Found" : "Application Error Report"}</h2>
  </div>

  ${
    email || additionalInfo
      ? `
  <div class="reporter-info">
    <div class="section-title">Reporter Information</div>
    ${email ? `<div class="field"><span class="field-label">Email:</span> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>` : ""}
    ${additionalInfo ? `<div class="field"><span class="field-label">What they were trying to do:</span><div class="user-message">${escapeHtml(additionalInfo)}</div></div>` : ""}
  </div>
  `
      : ""
  }

  <div class="section">
    <div class="section-title">Request Details</div>
    <div class="field">
      <div class="field-label">URL</div>
      <div class="field-value"><a href="${escapeHtml(context.url)}">${escapeHtml(context.url)}</a></div>
    </div>
    <div class="field">
      <div class="field-label">Referrer</div>
      <div class="field-value">${escapeHtml(context.referrer)}</div>
    </div>
    <div class="field">
      <div class="field-label">Timestamp</div>
      <div class="field-value">${escapeHtml(context.timestamp)}</div>
    </div>
    <div class="field">
      <div class="field-label">User Agent</div>
      <div class="field-value" style="font-size: 12px;">${escapeHtml(context.userAgent)}</div>
    </div>
  </div>

  ${
    context.errorMessage
      ? `
  <div class="section">
    <div class="section-title">Error Details</div>
    <div class="field">
      <div class="field-label">Error Message</div>
      <div class="code-block">${escapeHtml(context.errorMessage)}</div>
    </div>
    ${
      context.errorStack
        ? `
    <div class="field">
      <div class="field-label">Stack Trace</div>
      <div class="code-block">${escapeHtml(context.errorStack)}</div>
    </div>
    `
        : ""
    }
  </div>
  `
      : ""
  }
</body>
</html>
  `.trim();

  return { subject, text, html };
}

export async function POST(req: NextRequest) {
  try {
    const payload: ErrorReportPayload = await req.json();

    // Basic validation
    if (!payload.context?.url || !payload.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { subject, text, html } = buildErrorReportEmail(payload);

    await sendEmail({
      to: config.resend.supportEmail,
      subject,
      text,
      html,
      ...(payload.email && { replyTo: payload.email }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[error-report] Failed to send error report:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
