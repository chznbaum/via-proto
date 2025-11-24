/**
 * Job Task: notify_generation_failed
 *
 * Sends email notification when path generation fails after all retries.
 * This is a fire-and-forget task (no retries on failure).
 *
 * Flow:
 * 1. Fetch user profile (email, name)
 * 2. Compose step-specific failure email
 * 3. Send via Resend to user (CC support if configured)
 * 4. Log result
 *
 * Note: This task does not retry. Email delivery failures are logged but not retried.
 */

import type { Task } from 'graphile-worker';
import { Resend } from 'resend';
import { createServiceClient } from '@/libs/supabase/service';
import type { NotifyGenerationFailedPayload } from '../types';

/**
 * Get user-friendly step name
 */
function getStepDisplayName(step: string): string {
  const stepNames: Record<string, string> = {
    generate_metadata: 'Metadata Generation',
    fetch_unsplash_image: 'Image Fetching',
    generate_sections_resources: 'Resource Curation',
  };
  return stepNames[step] || step;
}

/**
 * Get step-specific explanation for user
 */
function getStepExplanation(step: string): string {
  const explanations: Record<string, string> = {
    generate_metadata:
      'We couldn\'t generate the path title, description, and skill level. ' +
      'This is usually a temporary issue. Please try creating the path again.',

    fetch_unsplash_image:
      'We couldn\'t fetch a cover image from Unsplash. ' +
      'The good news: your path content was generated successfully and is ready to use! ' +
      'You can add a custom image later if desired.',

    generate_sections_resources:
      'We successfully created the path title and description, but couldn\'t generate the learning resources. ' +
      'Our team has been notified and will investigate.',
  };
  return explanations[step] || 'An unexpected error occurred during generation.';
}

/**
 * Build email HTML content
 */
function buildEmailHTML(params: {
  userName: string;
  topicName: string;
  step: string;
  stepDisplayName: string;
  explanation: string;
  pathId: string;
}): string {
  const { userName, topicName, stepDisplayName, explanation, pathId } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .content {
      margin-bottom: 24px;
    }
    .step-name {
      color: #dc2626;
      font-weight: 600;
    }
    .path-id {
      font-family: 'Courier New', monospace;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    .footer {
      font-size: 14px;
      color: #64748b;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0 0 8px 0;">Learning Path Generation Issue</h2>
    <p style="margin: 0; color: #64748b;">Topic: ${topicName}</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>We encountered an issue while generating your learning path for <strong>"${topicName}"</strong>.</p>

    <p><strong>What happened:</strong> The <span class="step-name">${stepDisplayName}</span> step failed after multiple attempts.</p>

    <p><strong>What this means:</strong><br>${explanation}</p>

    <p>Our support team has been notified and will investigate this issue.</p>

    <p style="font-size: 14px; color: #64748b;">
      <strong>Path ID:</strong> <span class="path-id">${pathId}</span>
    </p>
  </div>

  <div class="footer">
    <p>Best regards,<br>The ViaProto Team</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Task handler for failure notifications
 */
export const notifyGenerationFailedTask: Task = async (payload, helpers) => {
  const { pathId, step, error, userId, topicName } = payload as NotifyGenerationFailedPayload;

  console.log(`[notify_generation_failed] Sending notification for path ${pathId}, step: ${step}`);

  const supabase = createServiceClient();

  try {
    // Step 1: Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.warn(`[notify_generation_failed] User profile not found for ${userId}:`, profileError);
      // Don't throw - this is fire-and-forget
      return { success: false, reason: 'User profile not found' };
    }

    if (!profile.email) {
      console.warn(`[notify_generation_failed] User ${userId} has no email address`);
      return { success: false, reason: 'No email address' };
    }

    console.log(`[notify_generation_failed] Sending email to ${profile.email}`);

    // Step 2: Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Step 3: Build email content
    const stepDisplayName = getStepDisplayName(step);
    const explanation = getStepExplanation(step);
    const userName = profile.name || 'there';

    const emailHTML = buildEmailHTML({
      userName,
      topicName,
      step,
      stepDisplayName,
      explanation,
      pathId,
    });

    // Step 4: Send email
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@viaproto.com';

    const emailResult = await resend.emails.send({
      from: 'ViaProto <noreply@viaproto.com>',
      to: profile.email,
      // CC support if configured
      ...(process.env.SUPPORT_EMAIL && { cc: [supportEmail] }),
      subject: `Learning Path Generation Failed - ${topicName}`,
      html: emailHTML,
    });

    if (emailResult.error) {
      console.error(`[notify_generation_failed] Email send failed:`, emailResult.error);
      return { success: false, reason: 'Email send failed', error: emailResult.error };
    }

    console.log(`[notify_generation_failed] Email sent successfully. ID: ${emailResult.data?.id}`);

    return {
      success: true,
      emailId: emailResult.data?.id,
      sentTo: profile.email,
    };
  } catch (error) {
    console.error(`[notify_generation_failed] Error:`, error);
    // Don't throw - this is fire-and-forget
    // We log the error but don't fail the job
    return {
      success: false,
      reason: 'Exception during notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
