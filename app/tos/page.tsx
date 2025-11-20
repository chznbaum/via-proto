import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { Topbar } from "@/components/Topbar";
import Footer from "@/components/Footer";
import { createClient } from "@/libs/supabase/server";

export const metadata = getSEOTags({
  title: `Terms of Service | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = async () => {
  const lastUpdated = "November 20, 2025";

  // Fetch the Unsplash image from database
  const supabase = await createClient();
  const { data: unsplashImage } = await supabase
    .from("unsplash_images")
    .select("*")
    .eq("photo_id", "OQMZwNd3ThU")
    .single();

  return (
    <>
      <Topbar />
      <div className="container sm:py-8 xl:py-16 2xl:py-24 mt-20">
        <div className="grid gap-6 pb-8 sm:gap-8 lg:grid-cols-2 xl:pb-16 2xl:pb-24">
          <div className="flex flex-col max-lg:order-2">
            <div className="badge badge-outline border-base-300 badge-sm font-mono">
              Legal
            </div>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              Clear terms, transparent service
            </p>
            <p className="text-base-content/80 mt-2">
              When you use ViaProto, you're trusting me to provide AI-powered
              learning paths while respecting your data, privacy, and
              intellectual property. These terms ensure we're both on the same
              page.
            </p>
            <div className="mt-auto pt-8 sm:pt-12">
              <p className="relative max-w-xl italic max-sm:text-sm">
                I believe in building tools that empower learners. ViaProto
                curates and organizes quality resources—I don't replace content
                creators, I help you find them.
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
                alt="Person writing on paper"
                className="h-full w-full object-cover"
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
            <p className="text-xl font-medium sm:text-2xl">Terms of Service</p>
            <p className="text-base-content/80 mt-1 inline-block max-w-xl max-sm:text-sm">
              A clear outline of what you can expect from me—and what I expect
              from you—when using ViaProto
            </p>
            <p className="text-base-content/60 mt-2 text-sm">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <div className="mt-8 flex gap-8 max-lg:flex-col max-sm:text-sm sm:mt-12 sm:gap-16 xl:mt-16">
            {/* Table of Contents - Sticky Sidebar */}
            <div className="card bg-base-100 h-fit min-w-72 p-4 shadow sm:p-6 lg:sticky lg:top-24">
              <p className="text-lg font-medium">Table of Contents</p>
              <ul className="*:text-base-content/80 *:hover:text-base-content ms-4 mt-3 list-decimal space-y-1 *:transition-all max-sm:text-sm">
                <li>
                  <Link href="#acceptance">Acceptance of Terms</Link>
                </li>
                <li>
                  <Link href="#services">Services Offered</Link>
                </li>
                <li>
                  <Link href="#account">Account Responsibilities</Link>
                </li>
                <li>
                  <Link href="#eligibility">Eligibility & Age Requirements</Link>
                </li>
                <li>
                  <Link href="#payment">Payment & Billing</Link>
                </li>
                <li>
                  <Link href="#subscriptions">Subscription Tiers & Rate Limits</Link>
                </li>
                <li>
                  <Link href="#conduct">User Conduct & Acceptable Use</Link>
                </li>
                <li>
                  <Link href="#external">External Resources & Links</Link>
                </li>
                <li>
                  <Link href="#public-paths">Public Paths & User Content</Link>
                </li>
                <li>
                  <Link href="#ai-content">AI-Generated Content</Link>
                </li>
                <li>
                  <Link href="#intellectual">Intellectual Property</Link>
                </li>
                <li>
                  <Link href="#beta">Beta Service & As-Is Disclaimer</Link>
                </li>
                <li>
                  <Link href="#privacy">Privacy and Data Collection</Link>
                </li>
                <li>
                  <Link href="#modifications">Modifications to Terms</Link>
                </li>
                <li>
                  <Link href="#termination">Termination of Access</Link>
                </li>
                <li>
                  <Link href="#liability">Limitation of Liability</Link>
                </li>
                <li>
                  <Link href="#law">Governing Law</Link>
                </li>
                <li>
                  <Link href="#contact">Contact Information</Link>
                </li>
              </ul>
            </div>

            {/* Main Content */}
            <div className="max-sm:text-sm">
              <div id="acceptance" className="scroll-mt-24">
                <h2 className="text-base font-medium sm:text-lg">
                  1. Acceptance of Terms
                </h2>
                <p className="mt-2">
                  By accessing or using ViaProto (the "Service"), you agree to be
                  bound by these Terms of Service ("Terms"). If you do not agree
                  to these Terms, please do not use the Service.
                  <br />
                  <br />
                  ViaProto is operated by Chazona Baum as a sole proprietorship.
                  These Terms constitute a legally binding agreement between you
                  and me as the Service provider.
                </p>
              </div>

              <div id="services" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  2. Services Offered
                </h2>
                <p className="mt-2">
                  ViaProto provides an AI-powered platform that generates
                  personalized learning pathways by curating and organizing
                  external educational resources. The Service includes:
                  <br />
                  <br />
                  • <strong>Learning Path Generation:</strong> AI-curated
                  roadmaps with sequenced sections and resources
                  <br />
                  • <strong>Resource Curation:</strong> Links to external courses,
                  articles, videos, and tutorials
                  <br />
                  • <strong>Progress Tracking:</strong> Tools to monitor your
                  learning journey (Pro tier and above)
                  <br />
                  • <strong>Team Collaboration:</strong> Shared learning paths
                  for teams (Team tier)
                  <br />
                  • <strong>Public Path Discovery:</strong> Browse and view
                  learning paths shared by other users
                  <br />
                  <br />
                  <strong>Important:</strong> I curate and organize existing
                  resources—I do not create educational content. All learning
                  resources link to their original sources.
                </p>
              </div>

              <div id="account" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  3. Account Responsibilities
                </h2>
                <p className="mt-2">
                  To use certain features of ViaProto, you must create an account
                  using Google OAuth authentication. You are responsible for:
                  <br />
                  <br />
                  • Maintaining the security of your account credentials
                  <br />
                  • All activities that occur under your account
                  <br />
                  • Ensuring your account information is accurate and up-to-date
                  <br />
                  • Notifying me immediately of any unauthorized use
                  <br />
                  <br />
                  You may not share your account with others or allow others to
                  access your account. Each account is for individual use only
                  (unless you have a Team subscription with multiple seats).
                </p>
              </div>

              <div id="eligibility" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  4. Eligibility & Age Requirements
                </h2>
                <p className="mt-2">
                  You must be at least 18 years old to use ViaProto. By using the
                  Service, you represent and warrant that you are 18 years of age
                  or older.
                  <br />
                  <br />
                  ViaProto is designed for adult learners and is not intended for
                  users under the age of 18. If I discover that a user is under
                  18, I reserve the right to immediately terminate their account
                  without notice.
                </p>
              </div>

              <div id="payment" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  5. Payment & Billing
                </h2>
                <p className="mt-2">
                  ViaProto offers both free and paid subscription plans. By
                  subscribing to a paid plan, you agree to the following:
                  <br />
                  <br />
                  <strong>Billing:</strong>
                  <br />
                  • Subscriptions are billed monthly or annually, as selected
                  during checkout
                  <br />
                  • Payment is processed securely through Stripe
                  <br />
                  • You authorize me to charge your payment method on a recurring
                  basis
                  <br />
                  • Prices are in USD and may be subject to change with notice
                  <br />
                  <br />
                  <strong>No Refunds:</strong>
                  <br />
                  Due to the nature of the AI-powered service and the immediate
                  access to generated learning paths, <strong>all payments are
                  non-refundable</strong>. This includes but is not limited to:
                  <br />
                  • Monthly and annual subscriptions
                  <br />
                  • Partial month refunds
                  <br />
                  • Pro-rated refunds upon cancellation
                  <br />
                  <br />
                  <strong>Cancellation:</strong>
                  <br />
                  You may cancel your subscription at any time through your
                  account settings or the Stripe Customer Portal. Upon
                  cancellation:
                  <br />
                  • You will retain access until the end of your current billing
                  period
                  <br />
                  • No refund will be issued for the remaining days in your
                  billing cycle
                  <br />
                  • Your subscription will not automatically renew
                  <br />
                  • Your account will revert to the Free tier after expiration
                </p>
              </div>

              <div id="subscriptions" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  6. Subscription Tiers & Rate Limits
                </h2>
                <p className="mt-2">
                  ViaProto offers three subscription tiers, each with specific
                  rate limits and AI model access:
                  <br />
                  <br />
                  <strong>Free Tier:</strong>
                  <br />
                  • 1 learning path generation per billing cycle
                  <br />
                  • AI models available: DeepSeek, Qwen, Kimi K2, and other quality models
                  <br />
                  • All generated paths are public by default
                  <br />
                  • View-only access to all public paths
                  <br />
                  • No progress tracking
                  <br />
                  <br />
                  <strong>Pro Tier:</strong>
                  <br />
                  • 5 learning path generations per billing cycle
                  <br />
                  • AI models available: All Free tier models plus premium models from Anthropic (Claude), OpenAI (GPT), and Perplexity
                  <br />
                  • Private learning paths by default
                  <br />
                  • Progress tracking and notes
                  <br />
                  • Priority support
                  <br />
                  <br />
                  <strong>Team Tier:</strong>
                  <br />
                  • 10 base paths + 3 paths per team member per billing cycle
                  <br />
                  • AI models available: All Free and Pro tier models
                  <br />
                  • Team collaboration and shared paths
                  <br />
                  • All Pro tier features
                  <br />
                  • Team admin dashboard
                  <br />
                  <br />
                  You can select which AI model to use for each path generation.
                  Rate limits reset on your billing cycle anniversary, not on
                  calendar months. Unused path generations do not roll over to
                  the next billing period.
                </p>
              </div>

              <div id="conduct" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  7. User Conduct & Acceptable Use
                </h2>
                <p className="mt-2">
                  You agree to use ViaProto responsibly and not to:
                  <br />
                  <br />
                  • Attempt prompt injection or other AI manipulation techniques
                  <br />
                  • Generate paths with offensive, illegal, or harmful content
                  <br />
                  • Abuse rate limits by creating multiple accounts
                  <br />
                  • Scrape or automatically download path data at scale
                  <br />
                  • Reverse engineer or copy the AI prompts or system
                  architecture
                  <br />
                  • Use the Service for any illegal purpose
                  <br />
                  • Harass, abuse, or harm other users
                  <br />
                  • Share misleading or fraudulent learning paths publicly
                  <br />
                  • Impersonate others or misrepresent your affiliation
                  <br />
                  <br />
                  Violations may result in immediate account suspension or
                  termination without refund.
                </p>
              </div>

              <div id="external" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  8. External Resources & Links Disclaimer
                </h2>
                <p className="mt-2">
                  ViaProto curates learning paths by linking to external
                  educational resources (courses, articles, videos, tutorials,
                  etc.). You acknowledge and agree that:
                  <br />
                  <br />
                  • <strong>I do not own or control external content:</strong>{" "}
                  All linked resources are owned and operated by third parties.
                  <br />
                  • <strong>No guarantees of availability:</strong> External links
                  may become broken, moved, or removed at any time. I am not
                  responsible for link rot or content changes.
                  <br />
                  • <strong>Access at your own risk:</strong> You access external
                  resources at your own discretion and risk. I do not endorse or
                  guarantee the accuracy, quality, or safety of third-party
                  content.
                  <br />
                  • <strong>Third-party terms apply:</strong> Your use of external
                  resources is subject to their respective terms of service and
                  privacy policies.
                  <br />
                  • <strong>Paid resources:</strong> Some linked resources may
                  require separate payment. I clearly mark resources as "Free"
                  or "Paid" when known, but this information may change.
                  <br />
                  <br />
                  If you encounter broken links, you may use the "Regenerate
                  Section" feature (when available) to generate updated resource
                  suggestions.
                </p>
              </div>

              <div id="public-paths" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  9. Public Paths & User-Generated Content
                </h2>
                <p className="mt-2">
                  Users may choose to share their learning paths publicly (or are
                  required to on the Free tier). By making a path public, you
                  agree that:
                  <br />
                  <br />
                  • Your path becomes visible to all ViaProto users
                  <br />
                  • Your name (as displayed in your profile) will be shown as the
                  creator
                  <br />
                  • Your path may appear in search results and public browse
                  pages
                  <br />
                  • Other users may view (but not edit) your public path
                  <br />
                  • You retain ownership of the path structure and organization
                  <br />
                  <br />
                  <strong>Content Standards:</strong>
                  <br />
                  Public paths must not contain:
                  <br />
                  • Offensive, discriminatory, or hateful language
                  <br />
                  • Spam or promotional content unrelated to learning
                  <br />
                  • Misleading or fraudulent information
                  <br />
                  • Links to illegal or harmful content
                  <br />
                  <br />
                  I reserve the right to remove public paths that violate these
                  standards or the Acceptable Use policy.
                </p>
              </div>

              <div id="ai-content" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  10. AI-Generated Content Disclaimer
                </h2>
                <p className="mt-2">
                  ViaProto uses AI models from various providers (including
                  Anthropic, OpenAI, DeepSeek, Qwen, Perplexity, and others via
                  OpenRouter) to generate learning path structures and curate
                  resources. You acknowledge that:
                  <br />
                  <br />
                  • <strong>AI-assisted curation, not instruction:</strong> The AI
                  generates organizational structures and resource recommendations,
                  not educational content itself.
                  <br />
                  • <strong>Accuracy not guaranteed:</strong> While I strive for
                  quality, AI-generated paths may contain errors, omissions, or
                  suboptimal sequencing. Use your discretion.
                  <br />
                  • <strong>No pedagogical certification:</strong> Generated paths
                  are suggestions based on AI analysis, not certified curricula.
                  <br />
                  • <strong>Model limitations:</strong> AI models have knowledge
                  cutoff dates and may not reflect the very latest developments in
                  a field.
                  <br />
                  • <strong>Your responsibility:</strong> You are responsible for
                  evaluating the suitability of any learning path for your goals.
                  <br />
                  <br />
                  I encourage you to customize and adapt AI-generated paths to
                  your specific needs.
                </p>
              </div>

              <div id="intellectual" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  11. Intellectual Property
                </h2>
                <p className="mt-2">
                  <strong>Your Content:</strong>
                  <br />
                  • You own the learning paths you create or customize
                  <br />
                  • You retain all rights to any notes or customizations you add
                  <br />
                  • By making paths public, you grant me a license to display them
                  to other users
                  <br />
                  <br />
                  <strong>My Content:</strong>
                  <br />
                  • The ViaProto platform, including software, design, branding,
                  and AI prompts, is my proprietary property
                  <br />
                  • You may not reproduce, modify, or distribute the platform
                  without written permission
                  <br />
                  • AI-generated path suggestions are provided for your
                  personal use only
                  <br />
                  <br />
                  <strong>Third-Party Content:</strong>
                  <br />
                  • All linked resources remain the property of their respective
                  owners
                  <br />
                  • I do not claim ownership of any third-party educational
                  content
                </p>
              </div>

              <div id="beta" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  12. Beta Service & As-Is Disclaimer
                </h2>
                <p className="mt-2">
                  ViaProto is currently in beta/MVP stage. By using the Service,
                  you acknowledge that:
                  <br />
                  <br />
                  • <strong>Service provided "as-is":</strong> The Service is
                  provided on an "as-is" and "as-available" basis without
                  warranties of any kind.
                  <br />
                  • <strong>May contain bugs or errors:</strong> Beta software may
                  have defects, interruptions, or unexpected behavior.
                  <br />
                  • <strong>Features may change:</strong> I may add, modify, or
                  remove features without notice.
                  <br />
                  • <strong>No uptime guarantee:</strong> I do not guarantee
                  continuous, uninterrupted access to the Service.
                  <br />
                  • <strong>Data loss possible:</strong> While I implement
                  backups, I cannot guarantee against data loss.
                  <br />
                  <br />
                  I appreciate your patience as I improve and refine ViaProto
                  based on user feedback.
                </p>
              </div>

              <div id="privacy" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  13. Privacy and Data Collection
                </h2>
                <p className="mt-2">
                  I take your privacy seriously. I collect data to enhance your
                  experience and improve the Service. By using ViaProto, you
                  consent to the{" "}
                  <Link
                    href="/privacy-policy"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </Link>
                  , which outlines how I collect, store, and use your data.
                  <br />
                  <br />
                  Key points:
                  <br />
                  • I collect email, name, and avatar via Google OAuth
                  <br />
                  • Payment information is processed securely by Stripe (I do not
                  store card details)
                  <br />
                  • Usage data includes paths generated, topics selected, and view
                  counts
                  <br />
                  • Your prompts are sent to AI model providers (Anthropic,
                  OpenAI, DeepSeek, and others) via OpenRouter
                  <br />
                  • Public paths are visible to all users by design
                  <br />
                  <br />
                  For more details, please review the{" "}
                  <Link
                    href="/privacy-policy"
                    className="link link-primary"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div id="modifications" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  14. Modifications to Services & Terms
                </h2>
                <p className="mt-2">
                  I may update these Terms or modify the Service from time to
                  time. When I do:
                  <br />
                  <br />
                  • I will update the "Last Updated" date at the top of this page
                  <br />
                  • For significant changes, I will notify you via email
                  <br />
                  • Your continued use of the Service after changes constitutes
                  acceptance
                  <br />
                  • You are encouraged to review these Terms periodically
                  <br />
                  <br />
                  If you do not agree to modified Terms, you should discontinue
                  use of the Service and cancel your subscription.
                </p>
              </div>

              <div id="termination" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  15. Termination of Access
                </h2>
                <p className="mt-2">
                  I reserve the right to suspend or terminate your access to
                  ViaProto at my discretion if you:
                  <br />
                  <br />
                  • Violate these Terms of Service
                  <br />
                  • Engage in abusive or harmful behavior
                  <br />
                  • Attempt to manipulate or abuse the systems
                  <br />
                  • Provide false information or impersonate others
                  <br />
                  • Are under 18 years of age
                  <br />
                  <br />
                  <strong>Termination Process:</strong>
                  <br />
                  • I will notify you via email if your account is suspended
                  <br />
                  • You may be given the opportunity to appeal if you believe
                  there has been a mistake
                  <br />
                  • Termination for cause forfeits any remaining subscription time
                  without refund
                  <br />
                  <br />
                  <strong>Account Deletion:</strong>
                  <br />
                  You may request account deletion at any time by contacting{" "}
                  {config.resend.supportEmail}. Upon deletion:
                  <br />
                  • Your personal data will be removed from the systems
                  <br />
                  • Public paths you created may be retained or anonymized
                  <br />
                  • Active subscriptions will be canceled without refund
                </p>
              </div>

              <div id="liability" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  16. Limitation of Liability
                </h2>
                <p className="mt-2">
                  To the maximum extent permitted by law:
                  <br />
                  <br />
                  • <strong>No liability for external content:</strong> I am not
                  responsible for the accuracy, quality, or availability of
                  third-party resources linked in learning paths.
                  <br />
                  • <strong>No liability for learning outcomes:</strong> I do not
                  guarantee that following a learning path will result in skill
                  mastery, employment, or any specific outcome.
                  <br />
                  • <strong>Service interruptions:</strong> I am not liable for
                  Service downtime, data loss, or technical issues.
                  <br />
                  • <strong>AI errors:</strong> I am not responsible for
                  inaccuracies, omissions, or errors in AI-generated content.
                  <br />
                  • <strong>Limited damages:</strong> My total liability to you
                  for any claims arising from the Service is limited to the amount
                  you paid in the 12 months prior to the claim.
                  <br />
                  • <strong>No indirect damages:</strong> I am not liable for
                  indirect, incidental, or consequential damages.
                  <br />
                  <br />
                  Some jurisdictions do not allow limitation of liability, so these
                  limitations may not apply to you.
                </p>
              </div>

              <div id="law" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  17. Governing Law
                </h2>
                <p className="mt-2">
                  These Terms are governed by the laws of the Commonwealth of
                  Virginia, United States, without regard to its conflict of law
                  provisions.
                  <br />
                  <br />
                  Any disputes arising out of or relating to these Terms or your
                  use of ViaProto will be resolved in the state or federal courts
                  located in Virginia. By using the Service, you consent to the
                  jurisdiction and venue of these courts.
                </p>
              </div>

              <div id="contact" className="mt-8 scroll-mt-24 sm:mt-12">
                <h2 className="text-base font-medium sm:text-lg">
                  18. Contact Information
                </h2>
                <p className="mt-2">
                  If you have any questions, concerns, or need clarification about
                  these Terms of Service, please contact me:
                  <br />
                  <br />
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${config.resend.supportEmail}`}
                    className="link link-primary"
                  >
                    {config.resend.supportEmail}
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
                  I'm here to assist you and ensure you have a great experience
                  with ViaProto.
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-base-300">
                <p className="text-base-content/60 text-sm text-center">
                  ViaProto is operated by Chazona Baum
                  <br />
                  Last Updated: {lastUpdated}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TOS;
