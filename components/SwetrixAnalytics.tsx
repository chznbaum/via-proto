import Script from "next/script";

export const SwetrixAnalytics = () => {
  return (
    <>
      <Script
        src="https://swetrix.org/swetrix.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-expect-error - swetrix is loaded from external script
          swetrix.init("8v56UDklPmgM", {
            apiURL: "https://api.analytics.chazona.dev/log",
          });
          // @ts-expect-error - swetrix is loaded from external script
          swetrix.trackViews();
        }}
      />
      <noscript>
        <img
          src="https://api.analytics.chazona.dev/log/noscript?pid=8v56UDklPmgM"
          alt=""
          referrerPolicy="no-referrer-when-downgrade"
        />
      </noscript>
    </>
  );
};
