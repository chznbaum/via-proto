'use client';

import { useState } from 'react';
import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

// <Pricing/> displays the pricing plans for your app
// It's your Stripe config in config.js.stripe.plans[] that will be used to display the plans
// <ButtonCheckout /> renders a button that will redirect the user to Stripe checkout called the /api/stripe/create-checkout API endpoint with the correct priceId

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [teamSeats, setTeamSeats] = useState<number>(2);

  // Group plans by tier and filter by billing period
  const plans = config.stripe.plans
    .filter(p => p.billingPeriod === billingPeriod)
    .reduce((acc, plan) => {
      if (!acc.find(p => p.tier === plan.tier)) {
        acc.push(plan);
      }
      return acc;
    }, [] as typeof config.stripe.plans);

  return (
    <section className="overflow-hidden" id="pricing">
      <div className="py-24 px-8 max-w-5xl mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <p className="font-medium text-primary mb-8">Pricing</p>
          <h2 className="font-bold text-3xl lg:text-5xl tracking-tight">
            AI-Powered Learning Paths
          </h2>
          <p className="text-base-content/75 mt-4 text-lg">
            Choose the plan that fits your learning journey
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="tabs tabs-boxed">
            <button
              className={`tab ${billingPeriod === 'monthly' ? 'tab-active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`tab ${billingPeriod === 'yearly' ? 'tab-active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
              <span className="ml-2 badge badge-sm badge-success">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Team Seats Selector */}
        <div className="flex justify-center mb-12">
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Team seats (for Team plan)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setTeamSeats(Math.max(2, teamSeats - 1))}
                disabled={teamSeats <= 2}
              >
                -
              </button>
              <input
                type="number"
                className="input input-bordered w-20 text-center"
                value={teamSeats}
                onChange={(e) => setTeamSeats(Math.max(2, parseInt(e.target.value) || 2))}
                min="2"
              />
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setTeamSeats(teamSeats + 1)}
              >
                +
              </button>
              <span className="text-sm text-base-content/75">seats</span>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {plans.map((plan) => (
            <div key={plan.priceId} className="relative w-full max-w-lg">
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span
                    className={`badge text-xs text-primary-content font-semibold border-0 bg-primary`}
                  >
                    POPULAR
                  </span>
                </div>
              )}

              {plan.isFeatured && (
                <div
                  className={`absolute -inset-[1px] rounded-[9px] bg-primary z-10`}
                ></div>
              )}

              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-base-100 p-8 rounded-lg">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold">{plan.name}</p>
                    {plan.description && (
                      <p className="text-base-content/80 mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {plan.perSeat ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <p className="text-5xl tracking-tight font-extrabold">
                          ${plan.price * teamSeats}
                        </p>
                        <div className="flex flex-col">
                          <p className="text-xs text-base-content/75 uppercase font-semibold">
                            USD
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-base-content/75">
                        ${plan.price}/seat × {teamSeats} seats
                      </p>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      {plan.priceAnchor && (
                        <div className="flex flex-col justify-end mb-[4px] text-lg ">
                          <p className="relative">
                            <span className="absolute bg-base-content h-[1.5px] inset-x-0 top-[53%]"></span>
                            <span className="text-base-content/80">
                              ${plan.priceAnchor}
                            </span>
                          </p>
                        </div>
                      )}
                      <p className={`text-5xl tracking-tight font-extrabold`}>
                        ${plan.price}
                      </p>
                      <div className="flex flex-col justify-end mb-[4px]">
                        <p className="text-xs text-base-content/75 uppercase font-semibold">
                          USD
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {plan.features && (
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-[18px] h-[18px] opacity-80 shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>

                        <span>{feature.name} </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <ButtonCheckout
                    priceId={plan.priceId}
                    mode="subscription"
                    seatCount={plan.perSeat ? teamSeats : undefined}
                    disabled={plan.tier === 'team' && !config.stripe.teams_enabled}
                    buttonText={plan.tier === 'team' && !config.stripe.teams_enabled ? 'Coming Soon' : undefined}
                  />

                  <p className="flex items-center justify-center gap-2 text-sm text-center text-base-content/80 font-medium relative">
                    Cancel anytime
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
