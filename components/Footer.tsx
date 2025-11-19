import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import logo from "@/app/icon.png";

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.resend.supportEmail, the link won't be displayed.

const Footer = () => {
  return (
    <div className="group/section pt-4 md:pt-6 lg:pt-8 2xl:pt-12">
      {/* Elevated CTA Section */}
      <div className="-mb-32 flex items-center justify-center">
        <div className="bg-base-100 dark:bg-base-300 group relative flex max-w-xs flex-col items-center overflow-hidden rounded-lg p-4 text-center sm:w-5xl sm:max-w-4xl md:p-6 xl:p-10">
          <span className="absolute -start-16 -top-16 size-44 opacity-5 transition-all group-hover:size-48 group-hover:opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          <span className="absolute -end-16 -bottom-16 size-44 opacity-5 transition-all group-hover:size-48 group-hover:opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>

          <p className="text-lg font-semibold md:text-xl xl:text-2xl">Start Learning Today</p>
          <p className="text-base-content/80 mt-2 max-w-2xl text-xs sm:text-sm md:text-base">
            Get started in seconds and experience AI-powered learning paths. Discover curated resources from real creators and master any skill.
          </p>
          <div className="mt-4 flex items-center gap-3 xl:mt-6">
            <Link href="/dashboard" className="btn btn-primary btn-lg gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
              <p>Get Started Free</p>
            </Link>
            <Link href="/explore" className="btn btn-lg btn-ghost gap-2.5 max-sm:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              Explore Paths
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Proper */}
      <footer className="bg-base-200/25 pt-44 xl:pt-60">
        <div className="container max-w-7xl mx-auto px-8">
          <div className="grid gap-6 md:grid-cols-5 md:gap-8 xl:gap-12">
            <div className="col-span-2">
              <Link href="/" className="flex gap-2 items-center">
                <Image
                  src={logo}
                  alt={`${config.appName} logo`}
                  priority={true}
                  className="w-6 h-6"
                  width={24}
                  height={24}
                />
                <strong className="font-extrabold tracking-tight text-base md:text-lg">
                  {config.appName}
                </strong>
              </Link>
              <p className="text-base-content/80 mt-3 max-w-sm">
                {config.appDescription}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-medium">Product</h2>
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/explore" className="link link-hover text-base-content/70 hover:text-base-content">
                  Explore Paths
                </Link>
                <Link href="/#features" className="link link-hover text-base-content/70 hover:text-base-content">
                  Features
                </Link>
                <Link href="/#pricing" className="link link-hover text-base-content/70 hover:text-base-content">
                  Pricing
                </Link>
                <Link href="/dashboard" className="link link-hover text-base-content/70 hover:text-base-content">
                  Dashboard
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium">Resources</h2>
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/#faq" className="link link-hover text-base-content/70 hover:text-base-content">
                  FAQ
                </Link>
                {config.resend.supportEmail && (
                  <a
                    href={`mailto:${config.resend.supportEmail}`}
                    target="_blank"
                    className="link link-hover text-base-content/70 hover:text-base-content"
                    aria-label="Contact Support"
                  >
                    Support
                  </a>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium">Legal</h2>
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/tos" className="link link-hover text-base-content/70 hover:text-base-content">
                  Terms of Service
                </Link>
                <Link href="/privacy-policy" className="link link-hover text-base-content/70 hover:text-base-content">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <hr className="text-base-200 mt-8" />
        <div className="container max-w-7xl mx-auto px-8 flex flex-wrap items-center justify-between gap-2 py-4">
          <p className="text-sm text-base-content/60">
            © {new Date().getFullYear()} {config.appName} - All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
