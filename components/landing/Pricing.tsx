"use client";

import { useState } from "react";
import config from "@/config";
import ButtonCheckout from "@/components/ButtonCheckout";

export const Pricing = () => {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [teamSeats, setTeamSeats] = useState(2);

    // Get plans for current billing period
    const freePlan = config.stripe.plans.find(p => p.tier === 'free');
    const proPlan = config.stripe.plans.find(p => p.tier === 'pro' && p.billingPeriod === billingPeriod);
    const teamPlan = config.stripe.plans.find(p => p.tier === 'team' && p.billingPeriod === billingPeriod);

    return (
        <div className="group/section relative z-10 container mx-auto max-w-7xl py-8 md:py-12 lg:py-16 2xl:py-28" id="pricing">
            <p className="group-hover/section:text-primary text-base-content/60 text-center text-[12px] font-medium tracking-[1px] uppercase transition-all duration-300 group-hover/section:tracking-[2px]">
                Affordable
            </p>
            <p className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Flexible Learning Plans</p>
            <div className="mt-2 flex justify-center text-center">
                <p className="text-base-content/80 max-w-lg">
                    Choose a plan that fits your learning journey, with transparent pricing and AI-powered curation.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center xl:mt-12">
                <div className="tabs tabs-boxed tabs-sm border-base-300 relative gap-0.5 rounded-full border bg-transparent">
                    <label className="tab hover:bg-base-200/60 has-[:checked]:!bg-base-200 gap-0 !rounded-full bg-transparent transition-all duration-300">
                        <input
                            type="radio"
                            value="yearly"
                            name="plan_duration"
                            checked={billingPeriod === 'yearly'}
                            onChange={() => setBillingPeriod('yearly')}
                        />
                        <div className="gap ms-1 flex items-center gap-1.5">
                            <p className="font-medium">Annual</p>
                            <div className="bg-base-100 border-base-300 rounded-full border px-1.5 py-0.5 !text-xs">
                                Save 17%
                            </div>
                        </div>
                    </label>
                    <label className="tab hover:bg-base-200/60 has-[:checked]:!bg-base-200 gap-0 !rounded-full bg-transparent transition-all duration-300">
                        <input
                            type="radio"
                            name="plan_duration"
                            value="monthly"
                            checked={billingPeriod === 'monthly'}
                            onChange={() => setBillingPeriod('monthly')}
                        />
                        <p className="mx-1 font-medium">Monthly</p>
                    </label>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="mt-8 gap-8 space-y-4 md:space-y-6 lg:mt-12 xl:mx-20 xl:space-y-8 2xl:mx-36">
                <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:gap-8">
                    {/* Free Plan */}
                    <div className="card group card-border h-full cursor-pointer p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-base-200 rounded-box border-base-300 border p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base-content/80 text-sm/none italic">Try it out</p>
                                    <p className="mt-0.5 text-lg/none font-medium">Free</p>
                                </div>
                            </div>
                            <div className="text-end text-5xl leading-0">
                                <span className="text-base-content/50 align-super text-xl font-medium">$</span>
                                <span className="font-semibold">0</span>
                                <span className="text-base-content/80 text-sm">/month</span>
                            </div>
                        </div>

                        <p className="text-base-content/80 mt-3 text-sm">
                            Start learning with quality AI models and unlimited access to public learning paths from the community.
                        </p>
                        <hr className="border-base-200 -mx-6 my-4" />
                        <p className="text-base-content/80 text-sm font-medium">Includes</p>
                        <div className="mt-4 space-y-2">
                            {[
                                "1 learning path per month",
                                "DeepSeek, Qwen, Kimi, Z-AI models",
                                "Free Gemini & Llama models",
                                "All paths are public",
                                "Browse community paths",
                            ].map((feature, index) => (
                                <div className="flex items-center gap-3" key={index}>
                                    <div className="bg-primary/20 text-primary rounded-full p-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-6">
                            <a href="/dashboard" className="btn btn-outline border-base-300 rounded-box btn-block gap-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                                </svg>
                                <span>Get Started Free</span>
                            </a>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    {proPlan && (
                        <div className="card group card-border h-full cursor-pointer p-6 ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/20 rounded-box border-primary/30 border p-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
                                            <path d="M10 1l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H3v-4l-3-3 3-3V3h4l3-3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-primary text-sm/none italic font-semibold">Most Popular</p>
                                        <p className="mt-0.5 text-lg/none font-medium">Pro</p>
                                    </div>
                                </div>
                                <div className="text-end text-5xl leading-0">
                                    <span className="text-base-content/50 align-super text-xl font-medium">$</span>
                                    <span className="font-semibold">{proPlan.price}</span>
                                    <span className="text-base-content/80 text-sm">/month</span>
                                </div>
                            </div>

                            <p className="text-base-content/80 mt-3 text-sm">
                                Unlock premium AI models, private paths, progress tracking, and faster generation for serious learners.
                            </p>
                            <hr className="border-base-200 -mx-6 my-4" />
                            <p className="text-base-content/80 text-sm font-medium">Everything in Free, plus:</p>
                            <div className="mt-4 space-y-2">
                                {[
                                    "5 learning paths per month",
                                    "Claude Sonnet 4.5 & premium models",
                                    "GPT-4, Perplexity, Premium Gemini",
                                    "Private learning paths",
                                    "Progress tracking",
                                    "Priority generation speed",
                                ].map((feature, index) => (
                                    <div className="flex items-center gap-3" key={index}>
                                        <div className="bg-primary/20 text-primary rounded-full p-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-6">
                                <ButtonCheckout
                                    priceId={proPlan.priceId}
                                    mode="subscription"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Team Plan - Contrast card with proper dark mode support */}
                {teamPlan && (
                    <div className="card group card-border cursor-pointer p-6 bg-base-100 dark:bg-base-300">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-base-200 dark:bg-base-100 rounded-box border-base-300 border p-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base-content/80 text-sm/none italic">Ultimate</p>
                                    <p className="mt-0.5 text-xl/none font-medium">Team</p>
                                </div>
                            </div>
                            <div className="text-end text-5xl leading-0">
                                <span className="text-base-content/50 align-super text-xl font-medium">$</span>
                                <span className="font-semibold">{teamPlan.price * teamSeats}</span>
                                <span className="text-base-content/80 text-sm">/month</span>
                            </div>
                        </div>

                        <hr className="border-base-200 dark:border-base-content/20 -mx-6 my-6" />

                        {/* Team Seats Selector */}
                        <div className="mb-4">
                            <label className="text-base-content/80 text-sm font-medium mb-2 block">Team Size</label>
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
                                    className="input input-bordered w-20 text-center input-sm"
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
                                <span className="text-sm text-base-content/60">× ${teamPlan.price}/seat</span>
                            </div>
                        </div>

                        <p className="text-base-content/80 text-sm font-medium">Everything in Pro, plus:</p>
                        <div className="mt-4 grid grid-cols-1 space-y-1 gap-x-8 sm:grid-cols-2">
                            {[
                                "10 base paths + 3 per seat/month",
                                "Shared team workspace",
                                "Team learning paths",
                                "Collaborate on resources",
                                "Team analytics dashboard",
                                "Priority support",
                                "Custom onboarding",
                                "Bulk path generation",
                            ].map((feature, index) => (
                                <div className="flex items-center gap-3" key={index}>
                                    <div className="bg-primary/20 text-primary rounded-full p-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>

                        {/* Bottom section with description and buttons */}
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:gap-8">
                            <p className="text-base-content/80 text-sm">
                                Experience the full suite with team collaboration, advanced analytics, priority support, and custom onboarding to power your team's learning.
                            </p>
                            <div className="flex items-end justify-end gap-2.5">
                                <ButtonCheckout
                                    priceId={teamPlan.priceId}
                                    mode="subscription"
                                    seatCount={teamSeats}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
