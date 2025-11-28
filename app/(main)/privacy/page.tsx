import Link from "next/link";
import config from "@/config";
import { createClient } from "@/libs/supabase/server";
import { createPageMetadata } from "@/libs/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Privacy Policy for ViaProto - How we collect, use, and protect your personal information.",
  canonical: "/privacy",
});

const PrivacyPolicy = async () => {
  const lastUpdated = "November 20, 2025";

  // Fetch the Unsplash image from database
  const supabase = await createClient();
  const { data: unsplashImage } = await supabase
    .from("unsplash_images")
    .select("*")
    .eq("photo_id", "HkUDmu2uC9w")
    .single();

  return (
    <div className="container sm:py-8 xl:py-16 2xl:py-24 mt-20">
        <div className="grid gap-6 pb-8 sm:gap-8 lg:grid-cols-2 xl:pb-16 2xl:pb-24">
          <div className="flex flex-col max-lg:order-2">
            <div className="badge badge-outline border-base-300 badge-sm font-mono">
              Legal
            </div>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Your privacy matters
            </p>
            <p className="text-base-content/80 mt-2">
              I'm committed to protecting your personal information and being
              transparent about how I collect, use, and safeguard your data. This
              policy explains everything you need to know about data privacy at
              ViaProto.
            </p>
            <div className="mt-auto pt-8 sm:pt-12">
              <p className="relative max-w-xl italic max-sm:text-sm">
                Privacy is about trust. I only collect what will genuinely improve
                your learning experience, and I never sell your data.
                <span className="iconify lucide--quote text-base-content/5 absolute -start-6 -top-6 size-12 scale-x-[-1] transform max-sm:hidden"></span>
              </p>
              <p className="text-base-content/80 mt-1 text-sm font-medium max-sm:text-end">
                - Chazona Baum, Creator of ViaProto
              </p>
            </div>
          </div>
          {unsplashImage ? (
            <div className="relative h-50 sm:h-84 lg:ms-auto max-lg:w-full overflow-hidden rounded-lg">
              <img
                src={unsplashImage.url}
                alt={unsplashImage.alt_description || "Privacy policy sign"}
                className="w-full object-cover object-bottom"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                <p className="text-white text-xs">
                  Photo by{" "}
                  <a
                    href={unsplashImage.photographer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white/80"
                  >
                    {unsplashImage.photographer}
                  </a>{" "}
                  on{" "}
                  <a
                    href="https://unsplash.com?utm_source=ViaProto&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white/80"
                  >
                    Unsplash
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary to-secondary rounded-lg h-50 sm:h-84 lg:ms-auto flex items-center justify-center max-lg:w-full">

            </div>
          )}
        </div>

        <div className="py-8 xl:py-16 2xl:pb-24">
          <div className="text-center">
            <p className="text-xl font-medium sm:text-2xl">Privacy Policy</p>
            <p className="text-base-content/80 mt-1 inline-block max-w-xl max-sm:text-sm">
              How ViaProto collects, uses, and protects your personal information
            </p>
            <p className="text-base-content/75 mt-2 text-sm">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <div className="mt-8 flex gap-8 max-lg:flex-col max-sm:text-sm sm:mt-12 sm:gap-16 xl:mt-16">
            {/* Table of Contents - Sticky Sidebar */}
            <div className="card bg-base-100 h-fit min-w-72 p-4 shadow sm:p-6 lg:sticky lg:top-24">
              <p className="text-lg font-medium">Table of Contents</p>
              <ul className="*:text-base-content/80 *:hover:text-base-content ms-4 mt-3 list-decimal space-y-1 *:transition-all max-sm:text-sm">
                <li>
                  <Link href="#introduction">Introduction</Link>
                </li>
                <li>
                  <Link href="#information">Information We Collect</Link>
                </li>
                <li>
                  <Link href="#how-we-use">How We Use Your Information</Link>
                </li>
                <li>
                  <Link href="#third-party">Third-Party Services</Link>
                </li>
                <li>
                  <Link href="#data-storage">Data Storage & Security</Link>
                </li>
                <li>
                  <Link href="#cookies">Cookies & Tracking</Link>
                </li>
                <li>
                  <Link href="#ai-providers">AI Model Providers</Link>
                </li>
                <li>
                  <Link href="#public-paths">Public Paths & Visibility</Link>
                </li>
                <li>
                  <Link href="#data-sharing">Data Sharing & Disclosure</Link>
                </li>
                <li>
                  <Link href="#data-retention">Data Retention</Link>
                </li>
                <li>
                  <Link href="#your-rights">Your Privacy Rights</Link>
                </li>
                <li>
                  <Link href="#gdpr">GDPR Compliance</Link>
                </li>
                <li>
                  <Link href="#children">Children's Privacy</Link>
                </li>
                <li>
                  <Link href="#international">International Users</Link>
                </li>
                <li>
                  <Link href="#updates">Updates to This Policy</Link>
                </li>
                <li>
                  <Link href="#contact">Contact Information</Link>
                </li>
              </ul>
            </div>

            {/* Main Content */}
            <div className="max-sm:text-sm">
              <div id="introduction" className="scroll-mt-24">
                <h2 className="text-base font-medium sm:text-lg">
                  1. Introduction
                </h2>
                <p className="mt-2">
                  ViaProto ("I," "me," "my," or "the Service") is committed to
                  protecting your privacy. This Privacy Policy explains how I
                  collect, use, disclose, and safeguard your information when you
                  use ViaProto.
                  <br />
                  <br />
                  By using ViaProto, you agree to the collection and use of
                  information in accordance with this policy. If you do not agree
                  with this policy, please do not use the Service.
                  <br />
                  <br />
                  ViaProto is operated by Chazona Baum as a sole proprietorship
                  based in the Commonwealth of Virginia, United States.
                </p>
              </div>

              <div id="information" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  2. Information We Collect
                </h2>
                <p className="mt-2">
                  <strong>2.1 Personal Information You Provide</strong>
                  <br />
                  <br />
                  When you create an account using Google OAuth or magic link, I collect:
                  <br />
                  • <strong>Email address:</strong> Used for account
                  identification, authentication, and communication
                  <br />
                  • <strong>Name:</strong> Displayed on your profile and public
                  paths (if shared)
                  <br />
                  • <strong>Profile picture:</strong> Your Google avatar for
                  display in the app
                  <br />
                  <br />
                  <strong>2.2 Payment Information</strong>
                  <br />
                  <br />
                  When you subscribe to a paid plan:
                  <br />
                  • Payment details (credit card, billing address) are processed
                  securely by <strong>Stripe</strong>, my payment processor
                  <br />
                  • I do not store or have access to your full payment card
                  details
                  <br />
                  • Stripe provides me with a customer ID and subscription status
                  only
                  <br />
                  <br />
                  <strong>2.3 Usage Data</strong>
                  <br />
                  <br />
                  I automatically collect certain information when you use
                  ViaProto:
                  <br />
                  • <strong>Learning paths generated:</strong> Topics, skill
                  levels, and AI models selected
                  <br />
                  • <strong>Path interactions:</strong> View counts, edit history,
                  sharing settings
                  <br />
                  • <strong>Progress data:</strong> Resources marked complete,
                  notes added (Pro/Team tiers)
                  <br />
                  • <strong>Device information:</strong> Browser type, operating
                  system, IP address
                  <br />
                  • <strong>Log data:</strong> Access times, pages viewed, errors
                  encountered
                  <br />
                  <br />
                  <strong>2.4 Cookies & Local Storage</strong>
                  <br />
                  <br />
                  I use cookies and local storage to:
                  <br />
                  • Maintain your login session
                  <br />
                  • Remember your preferences (e.g., selected AI model)
                  <br />
                  • Analyze site usage via analytics tools
                  <br />
                  <br />
                  You can disable cookies in your browser, but some features may
                  not function properly.
                </p>
              </div>

              <div id="how-we-use" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  3. How We Use Your Information
                </h2>
                <p className="mt-2">
                  I use your information for the following purposes:
                  <br />
                  <br />
                  • <strong>Provide the Service:</strong> Generate learning paths,
                  manage your account, process subscriptions
                  <br />
                  • <strong>Communication:</strong> Send transactional emails
                  (account updates, password resets, subscription confirmations)
                  <br />
                  • <strong>Improve the Service:</strong> Analyze usage patterns,
                  fix bugs, develop new features
                  <br />
                  • <strong>Compliance:</strong> Fulfill legal obligations,
                  enforce terms of service, protect against fraud
                  <br />
                  • <strong>Marketing:</strong> Send occasional product updates or
                  feature announcements (you can opt out)
                  <br />
                  <br />
                  I will never sell your personal data to third parties for
                  marketing purposes.
                </p>
              </div>

              <div id="third-party" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  4. Third-Party Services
                </h2>
                <p className="mt-2">
                  ViaProto relies on the following third-party services, each with
                  their own privacy policies:
                  <br />
                  <br />
                  • <strong>Supabase (Database & Authentication):</strong>{" "}
                  Postgres database hosted in US/EU regions. Handles user
                  authentication via Google OAuth.{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Stripe (Payment Processing):</strong> PCI-compliant
                  payment processor. I do not store your card details.{" "}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>OpenRouter (AI Model Gateway):</strong> Routes
                  prompts to AI providers (see Section 7).{" "}
                  <a
                    href="https://openrouter.ai/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Resend (Transactional Emails):</strong> Sends account
                  emails and notifications.{" "}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Crisp Chat (Customer Support):</strong> Live chat
                  widget for support inquiries.{" "}
                  <a
                    href="https://crisp.chat/en/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>DataFast (Analytics):</strong> Privacy-focused
                  analytics to understand usage patterns.{" "}
                  <a
                    href="https://datafast.app/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  <br />
                  I carefully select service providers that prioritize data
                  security and comply with applicable privacy laws.
                </p>
              </div>

              <div id="data-storage" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  5. Data Storage & Security
                </h2>
                <p className="mt-2">
                  <strong>Storage:</strong>
                  <br />
                  • Your data is stored in Supabase-managed PostgreSQL databases
                  <br />
                  • Database servers are located in US or EU regions (configurable
                  per deployment)
                  <br />
                  • Data is encrypted at rest and in transit (TLS/SSL)
                  <br />
                  <br />
                  <strong>Security Measures:</strong>
                  <br />
                  • Google OAuth for secure authentication (no passwords stored)
                  <br />
                  • Row-Level Security (RLS) policies in database to enforce
                  access control
                  <br />
                  • Regular security updates and vulnerability monitoring
                  <br />
                  • Automated database backups
                  <br />
                  <br />
                  <strong>Important:</strong> No method of electronic storage is
                  100% secure. While I use industry-standard practices, I cannot
                  guarantee absolute security. You are responsible for maintaining
                  the confidentiality of your account credentials.
                </p>
              </div>

              <div id="cookies" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  6. Cookies & Tracking Technologies
                </h2>
                <p className="mt-2">
                  <strong>Types of Cookies Used:</strong>
                  <br />
                  <br />
                  • <strong>Essential Cookies:</strong> Required for
                  authentication and session management. You cannot opt out of
                  these and still use the Service.
                  <br />
                  • <strong>Analytics Cookies:</strong> Track page views, user
                  flows, and feature usage via DataFast. Helps me understand how
                  to improve the Service.
                  <br />
                  • <strong>Preference Cookies:</strong> Remember your settings
                  (e.g., selected AI model, theme).
                  <br />
                  <br />
                  <strong>Managing Cookies:</strong>
                  <br />
                  You can control cookie settings through your browser. Disabling
                  essential cookies will prevent you from using certain features.
                </p>
              </div>

              <div id="ai-providers" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  7. AI Model Providers & Data Sharing
                </h2>
                <p className="mt-2">
                  When you generate a learning path, your prompt (topic, skill
                  level, preferences) is sent to AI model providers via OpenRouter.
                  <br />
                  <br />
                  <strong>AI Providers Include:</strong>
                  <br />
                  • <strong>Anthropic</strong> (Claude models) -{" "}
                  <a
                    href="https://www.anthropic.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>OpenAI</strong> (GPT models) -{" "}
                  <a
                    href="https://openai.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Google</strong> (Gemini models) -{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>DeepSeek</strong> (DeepSeek models) -{" "}
                  <a
                    href="https://www.deepseek.com/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Alibaba Cloud</strong> (Qwen models) -{" "}
                  <a
                    href="https://www.alibabacloud.com/help/en/legal/latest/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Perplexity AI</strong> (Sonar models) -{" "}
                  <a
                    href="https://www.perplexity.ai/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • <strong>Moonshot AI</strong> (Kimi models) -{" "}
                  <a
                    href="https://www.moonshot.cn/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </a>
                  <br />
                  • Other providers available via OpenRouter (Meta, Amazon, etc.)
                  <br />
                  <br />
                  <strong>What Data Is Sent:</strong>
                  <br />
                  • Your learning topic and skill level
                  <br />
                  • Any custom instructions or preferences
                  <br />
                  • System prompts (e.g., "Generate a learning path for...")
                  <br />
                  <br />
                  <strong>What Is NOT Sent:</strong>
                  <br />
                  • Your name or email address
                  <br />
                  • Payment information
                  <br />
                  • Other learning paths you've created
                  <br />
                  <br />
                  <strong>Important:</strong> I do not control how AI providers
                  process your prompts. Each provider has their own data retention
                  and usage policies. By using ViaProto, you acknowledge that your
                  prompts will be sent to the AI provider you select. You can
                  choose which model to use for each path generation.
                </p>
              </div>

              <div id="public-paths" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  8. Public Paths & User Visibility
                </h2>
                <p className="mt-2">
                  <strong>Free Tier:</strong>
                  <br />
                  All learning paths generated on the Free tier are public by
                  default. This means:
                  <br />
                  • Your path is visible to all ViaProto users
                  <br />
                  • Your name (from your Google profile) is displayed as the
                  creator
                  <br />
                  • Your path may appear in search results and the public browse
                  page
                  <br />
                  <br />
                  <strong>Pro & Team Tiers:</strong>
                  <br />
                  Paths are private by default, but you can optionally share them
                  publicly.
                  <br />
                  <br />
                  <strong>What Is Visible in Public Paths:</strong>
                  <br />
                  • Your name (as shown in your profile)
                  <br />
                  • Path title, topic, skill level, and estimated hours
                  <br />
                  • Curated resources (titles, links, descriptions)
                  <br />
                  <br />
                  <strong>What Is NOT Visible:</strong>
                  <br />
                  • Your email address
                  <br />
                  • Progress tracking data
                  <br />
                  • Personal notes
                  <br />
                  • Private paths
                  <br />
                  <br />
                  You are responsible for ensuring that public paths do not
                  contain personal or sensitive information beyond what is
                  automatically included.
                </p>
              </div>

              <div id="data-sharing" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  9. Data Sharing & Disclosure
                </h2>
                <p className="mt-2">
                  I do not sell, rent, or trade your personal information to third
                  parties for their marketing purposes.
                  <br />
                  <br />
                  <strong>I May Share Your Data:</strong>
                  <br />
                  <br />
                  • <strong>With Service Providers:</strong> As described in
                  Section 4, to operate the Service (Supabase, Stripe, Resend,
                  etc.)
                  <br />
                  • <strong>With AI Providers:</strong> As described in Section 7,
                  when you generate learning paths
                  <br />
                  • <strong>For Legal Compliance:</strong> If required by law,
                  subpoena, or legal process
                  <br />
                  • <strong>To Protect Rights:</strong> To protect my rights,
                  safety, or property, or that of users
                  <br />
                  • <strong>Business Transfers:</strong> In the event of a merger,
                  acquisition, or sale of assets (users would be notified)
                  <br />
                  <br />
                  <strong>Public Information:</strong>
                  <br />
                  Any information you choose to share publicly (e.g., public
                  learning paths) can be viewed and potentially copied by other
                  users. Think carefully before sharing.
                </p>
              </div>

              <div id="data-retention" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  10. Data Retention
                </h2>
                <p className="mt-2">
                  <strong>Active Accounts:</strong>
                  <br />
                  I retain your account data for as long as your account is
                  active.
                  <br />
                  <br />
                  <strong>Account Deletion:</strong>
                  <br />
                  • You may request account deletion at any time by contacting{" "}
                  {config.resend.privacyEmail}
                  <br />
                  • Upon deletion, your personal information (name, email, avatar)
                  will be removed within 30 days
                  <br />
                  • Learning paths you created will either be:
                  <br />
                  &nbsp;&nbsp;◦ Deleted entirely (if private)
                  <br />
                  &nbsp;&nbsp;◦ Anonymized (if public, to preserve community
                  resources)
                  <br />
                  <br />
                  <strong>Backup Retention:</strong>
                  <br />
                  • Database backups may retain your data for up to 90 days after
                  deletion for disaster recovery purposes
                  <br />
                  • After 90 days, backups containing your data are permanently
                  deleted
                  <br />
                  <br />
                  <strong>Legal Obligations:</strong>
                  <br />I may retain certain data if required by law (e.g., for
                  tax records, fraud prevention).
                </p>
              </div>

              <div id="your-rights" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  11. Your Privacy Rights
                </h2>
                <p className="mt-2">
                  Depending on your location, you may have the following rights:
                  <br />
                  <br />
                  • <strong>Access:</strong> Request a copy of the personal data I
                  hold about you
                  <br />
                  • <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete data
                  <br />
                  • <strong>Deletion:</strong> Request deletion of your account
                  and personal data
                  <br />
                  • <strong>Portability:</strong> Request a machine-readable copy
                  of your data (e.g., your learning paths as JSON)
                  <br />
                  • <strong>Opt-Out:</strong> Unsubscribe from marketing emails
                  (transactional emails cannot be disabled)
                  <br />
                  • <strong>Object:</strong> Object to certain data processing
                  activities
                  <br />
                  <br />
                  <strong>How to Exercise Your Rights:</strong>
                  <br />
                  Email me at{" "}
                  <a
                    href={`mailto:${config.resend.privacyEmail}`}
                    className="link link-primary"
                  >
                    {config.resend.privacyEmail}
                  </a>{" "}
                  with your request. I will respond within 30 days.
                  <br />
                  <br />
                  <strong>Note:</strong> Data export and deletion requests are
                  currently handled manually. I will fulfill your request as
                  quickly as possible, but please allow up to 30 days for
                  processing.
                </p>
              </div>

              <div id="gdpr" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  12. GDPR Compliance (EU Users)
                </h2>
                <p className="mt-2">
                  If you are located in the European Economic Area (EEA), you have
                  additional rights under the General Data Protection Regulation
                  (GDPR):
                  <br />
                  <br />
                  <strong>Legal Basis for Processing:</strong>
                  <br />
                  • <strong>Contract Performance:</strong> Processing necessary to
                  provide the Service (account management, path generation)
                  <br />
                  • <strong>Legitimate Interest:</strong> Improving the Service,
                  fraud prevention, analytics
                  <br />
                  • <strong>Consent:</strong> Marketing emails (you can opt out at
                  any time)
                  <br />
                  <br />
                  <strong>Data Transfers:</strong>
                  <br />I use Supabase databases, which can be hosted in EU
                  regions. However, some third-party services (e.g., Stripe,
                  OpenRouter) may transfer data to the US or other countries. These
                  transfers are protected by:
                  <br />
                  • Standard Contractual Clauses (SCCs)
                  <br />
                  • Adequate safeguards per GDPR Article 46
                  <br />
                  <br />
                  <strong>Right to Lodge a Complaint:</strong>
                  <br />
                  If you believe your data is being misused, you have the right to
                  lodge a complaint with your local data protection authority (DPA).
                </p>
              </div>

              <div id="children" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  13. Children's Privacy
                </h2>
                <p className="mt-2">
                  ViaProto is not intended for users under the age of 18. I do not
                  knowingly collect personal information from children under 18.
                  <br />
                  <br />
                  If I discover that a child under 18 has provided personal
                  information, I will delete it immediately. If you believe your
                  child has provided information to ViaProto, please contact me at{" "}
                  {config.resend.privacyEmail}.
                </p>
              </div>

              <div id="international" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  14. International Users
                </h2>
                <p className="mt-2">
                  ViaProto is operated from the United States. If you access the
                  Service from outside the US, your information may be transferred
                  to, stored, and processed in the US or other countries.
                  <br />
                  <br />
                  By using ViaProto, you consent to the transfer of your
                  information to countries that may have different data protection
                  laws than your country of residence.
                  <br />
                  <br />
                  For EU users, see Section 12 (GDPR Compliance) for information
                  about data transfer safeguards.
                </p>
              </div>

              <div id="updates" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  15. Updates to This Privacy Policy
                </h2>
                <p className="mt-2">
                  I may update this Privacy Policy from time to time to reflect
                  changes in my practices, technology, or legal requirements.
                  <br />
                  <br />
                  <strong>When I Update This Policy:</strong>
                  <br />
                  • The "Last Updated" date at the top will be revised
                  <br />
                  • For significant changes, I will notify you via email
                  <br />
                  • Your continued use of the Service after updates constitutes
                  acceptance
                  <br />
                  <br />
                  I encourage you to review this Privacy Policy periodically to
                  stay informed about how I protect your information.
                </p>
              </div>

              <div id="contact" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  16. Contact Information
                </h2>
                <p className="mt-2">
                  If you have questions, concerns, or requests regarding this
                  Privacy Policy or how I handle your data, please contact me:
                  <br />
                  <br />
                  <strong>Privacy Inquiries:</strong>{" "}
                  <a
                    href={`mailto:${config.resend.privacyEmail}`}
                    className="link link-primary"
                  >
                    {config.resend.privacyEmail}
                  </a>
                  <br />
                  <strong>General Support:</strong>{" "}
                  <a
                    href={`mailto:${config.resend.supportEmail}`}
                    className="link link-primary"
                  >
                    {config.resend.supportEmail}
                  </a>
                  <br />
                  <strong>Security Issues:</strong>{" "}
                  <a
                    href={`mailto:${config.resend.securityEmail}`}
                    className="link link-primary"
                  >
                    {config.resend.securityEmail}
                  </a>
                  <br />
                  <strong>Website:</strong>{" "}
                  <a
                    href={`https://${config.domainName}`}
                    className="link link-primary"
                  >
                    {config.domainName}
                  </a>
                  <br />
                  <br />
                  I aim to respond to all privacy inquiries within 30 days.
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-base-300">
                <p className="text-base-content/75 text-sm text-center">
                  ViaProto is operated by Chazona Baum
                  <br />
                  Last Updated: {lastUpdated}
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default PrivacyPolicy;
