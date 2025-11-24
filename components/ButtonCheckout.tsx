"use client";

import { useState } from "react";
import apiClient from "@/libs/api";
import config from "@/config";

// This component is used to create Stripe Checkout Sessions
// It calls the /api/stripe/create-checkout route with the priceId, successUrl and cancelUrl
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
// You can also change the mode to "subscription" if you want to create a subscription instead of a one-time payment
const ButtonCheckout = ({
  priceId,
  mode = "subscription",
  seatCount,
  disabled = false,
  buttonText,
}: {
  priceId: string;
  mode?: "payment" | "subscription";
  seatCount?: number;
  disabled?: boolean;
  buttonText?: string;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-checkout",
        {
          priceId,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: window.location.href,
          mode,
          ...(seatCount && { seatCount }),
        }
      );

      window.location.href = url;
    } catch (e) {
      console.error(e);
    }

    setIsLoading(false);
  };

  return (
    <button
      className="btn btn-primary btn-block group"
      onClick={() => handlePayment()}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        ""
      )}
      {buttonText || `Get ${config?.appName}`}
    </button>
  );
};

export default ButtonCheckout;
