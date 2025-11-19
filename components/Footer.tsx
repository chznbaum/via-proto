import Link from "next/link";
import config from "@/config";

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.resend.supportEmail, the link won't be displayed.

const Footer = () => {
  return (
    <div className="group/section pt-4 md:pt-6 lg:pt-8 2xl:pt-12">
      {/* Elevated CTA Section */}
      <div className="-mb-32 flex items-center justify-center">
        <div className="bg-base-100 contrast-box group relative flex max-w-xs flex-col items-center overflow-hidden rounded-lg p-4 text-center sm:w-5xl sm:max-w-4xl md:p-6 xl:p-10" data-theme="dark">
          <span className="iconify lucide--circle absolute -start-16 -top-16 size-44 opacity-5 transition-all group-hover:size-48 group-hover:opacity-10"></span>
          <span className="iconify lucide--circle absolute -end-16 -bottom-16 size-44 opacity-5 transition-all group-hover:size-48 group-hover:opacity-10"></span>

          <h2 className="text-lg font-semibold md:text-xl xl:text-2xl">Start Learning Today</h2>
          <p className="text-base-content/80 mt-2 max-w-2xl text-xs sm:text-sm md:text-base">
            Get started in seconds and experience AI-powered learning paths. Discover curated resources from real creators and master any skill.
          </p>
          <div className="mt-4 flex items-center gap-3 xl:mt-6">
            <Link href="/dashboard" className="btn btn-primary btn-lg gap-2.5">
              <span className="iconify lucide--rocket size-4.5"></span>
              <p>Get Started Free</p>
            </Link>
            <Link href="/explore" className="btn btn-lg btn-ghost gap-2.5 max-sm:hidden">
              <span className="iconify lucide--search size-4.5"></span>
              Explore Paths
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Proper */}
      <footer className="bg-base-200/25 pt-44 xl:pt-60">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-5 md:gap-8 xl:gap-12">
            <div className="col-span-2">
              <Link href="/" className="flex gap-2 items-center">
                <span className="font-serif text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ViaPro.to
                </span>
              </Link>
              <p className="text-base-content/80 mt-3 max-w-sm">
                {config.appDescription}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://rss.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-square border-base-300 btn-sm"
                  aria-label="RSS/Beehiiv">
                  <span className="iconify tabler--rss size-5"></span>
                </a>
                <a
                  href="https://bsky.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-square border-base-300 btn-sm"
                  aria-label="Bluesky">
                  <span className="iconify tabler--brand-bluesky size-5"></span>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-square border-base-300 btn-sm"
                  aria-label="Github">
                  <span className="iconify tabler--brand-github size-5"></span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-square border-base-300 btn-sm"
                  aria-label="LinkedIn">
                  <span className="iconify tabler--brand-linkedin size-5"></span>
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium">Product</h2>
              <div className="*:not-hover:text-base-content/70 mt-2 flex flex-col gap-2">
                <Link href="/explore">Explore Paths</Link>
                <Link href="/#features">Features</Link>
                <Link href="/#pricing">Pricing</Link>
                <Link href="/dashboard">Dashboard</Link>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium">Resources</h2>
              <div className="*:not-hover:text-base-content/70 mt-2 flex flex-col gap-2">
                <Link href="/#faq">FAQ</Link>
                {config.resend.supportEmail && (
                  <a
                    href={`mailto:${config.resend.supportEmail}`}
                    target="_blank"
                    aria-label="Contact Support"
                  >
                    Support
                  </a>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium">Legal</h2>
              <div className="*:not-hover:text-base-content/70 mt-2 flex flex-col gap-2">
                <Link href="/tos">Terms of Service</Link>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>

        <hr className="text-base-200 mt-8" />
        <div className="container flex flex-wrap items-center justify-between gap-2 py-4">
          <p className="text-sm text-base-content/60">
            © {new Date().getFullYear()} {config.appName} - All rights reserved
          </p>
          <p className="text-sm text-base-content/60">
            Concept to Reality by{" "}
            <Link href="https://chazonabaum.com" className="text-blue-500 transition-all hover:text-blue-600" target="_blank">
              Chazona
            </Link>
          </p>
          <Link
            href="/#pricing"
            className="btn group from-primary to-secondary text-primary-content btn-sm max-sm:btn-square relative gap-2 border-0 bg-linear-to-r text-sm">
            <span className="iconify lucide--rocket size-4" />
            <span className="max-sm:hidden">Start Your Path</span>
            <div className="from-primary to-secondary absolute inset-x-0 top-1 -z-1 h-8 bg-linear-to-r opacity-40 blur-md transition-all duration-500 group-hover:opacity-60 group-hover:blur-lg"></div>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
