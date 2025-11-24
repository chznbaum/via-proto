import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "ViaPro.to",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Get a complete, personalized learning path in 60 seconds. Everything you need to master any skill, curated and organized for you.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "viapro.to",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "0e9f8788-eff9-4a98-b555-984b2e78383f",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
  },
  stripe: {
    plans: [
      {
        // Pro Monthly
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SV0QxD1xQn8aM2gSRgiYPWh"
            : "price_1SWt7EDnUZacDWq6Oq6GUtI0",
        name: "Pro",
        description: "Premium AI models • 5 paths/month",
        price: 12,
        priceAnchor: null,
        isFeatured: false,
        billingPeriod: "monthly",
        tier: "pro",
        features: [
          { name: "5 learning paths per month" },
          { name: "Premium Anthropic models" },
          { name: "Best Gemini and OpenAI models" },
          { name: "Private learning paths" },
          { name: "Priority support" },
        ],
      },
      {
        // Pro Yearly
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SV0QxD1xQn8aM2gHQEeq5lj"
            : "price_1SWt7EDnUZacDWq6Z9Kwh5eL",
        name: "Pro",
        description: "Claude Sonnet 4.5 • 5 paths/month",
        price: 100,
        priceAnchor: 120,
        isFeatured: true,
        billingPeriod: "yearly",
        tier: "pro",
        features: [
          { name: "5 learning paths per month" },
          { name: "Premium Anthropic models" },
          { name: "Best Gemini and OpenAI models" },
          { name: "Private learning paths" },
          { name: "Priority support" },
          { name: "2 months free" },
        ],
      },
      {
        // Team Monthly
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SV0VBD1xQn8aM2gP6WMraVn"
            : "price_1SWt7JDnUZacDWq6Kp7XHadT",
        name: "Team",
        description: "Collaboration • $10/seat/month",
        price: 10,
        priceAnchor: null,
        isFeatured: false,
        billingPeriod: "monthly",
        tier: "team",
        perSeat: true,
        minSeats: 2,
        features: [
          { name: "10+ paths per month (scales with seats)" },
          { name: "Premium Anthropic models" },
          { name: "Best Gemini and OpenAI models" },
          { name: "Team collaboration" },
          { name: "Private learning paths" },
          { name: "$10 per team member" },
        ],
      },
      {
        // Team Yearly
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SV0VBD1xQn8aM2gz44hjeiv"
            : "price_1SWt7JDnUZacDWq6DINsLPxF",
        name: "Team",
        description: "Collaboration • $10/seat/month",
        price: 80, // yearly per seat
        priceAnchor: 100,
        isFeatured: false,
        billingPeriod: "yearly",
        tier: "team",
        perSeat: true,
        minSeats: 2,
        features: [
          { name: "10+ paths per month (scales with seats)" },
          { name: "Premium Anthropic models" },
          { name: "Best Gemini and OpenAI models" },
          { name: "Team collaboration" },
          { name: "Private learning paths" },
          { name: "$10 per team member" },
          { name: "2 months free" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `ViaProto <noreply@notifications.viapro.to>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `ViaProto <hello@notifications.viapro.to>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@viapro.to",
    // Email to be used for privacy/GDPR requests
    privacyEmail: "privacy@viapro.to",
    // Email to be used for good-faith security disclosures or questions
    securityEmail: "security@viapro.to",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#570df8",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/auth/login",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;
