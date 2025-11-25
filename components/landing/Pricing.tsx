"use client";

import { useState } from "react";
import config from "@/config";
import ButtonCheckout from "@/components/ButtonCheckout";
import { TeamSizeSlider } from "./TeamSizeSlider";
import { trackEvent } from "@/components/SwetrixAnalytics";

export const Pricing = ({ teamsEnabled = config.stripe.teams_enabled }: { teamsEnabled?: boolean }) => {
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
            <h2 className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Flexible Learning Plans</h2>
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
                                    <span className="iconify lucide--sparkles size-5"></span>
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
                            <a
                                href="/dashboard"
                                className="btn btn-outline border-base-300 rounded-box btn-block gap-2.5"
                                onClick={() => trackEvent("cta.pricing.get_started_free")}
                            >
                                <span className="iconify lucide--arrow-right size-4"></span>
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
                                        <span className="iconify lucide--zap size-5 text-primary"></span>
                                    </div>
                                    <div>
                                        <p className="text-primary text-sm/none italic font-semibold">Track your progress</p>
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
                                    "10 learning paths per month",
                                    "Premium Anthropic models like Claude Sonnet 4.5",
                                    "GPT-5, Perplexity, Gemini 3",
                                    "Private learning paths",
                                    "Progress tracking (coming soon)",
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

                {/* Team Size Selector */}
                {teamPlan && (
                    <div className="mt-4">
                        <TeamSizeSlider
                            teamSeats={teamSeats}
                            setTeamSeats={setTeamSeats}
                            pricePerSeat={teamPlan.price}
                        />
                    </div>
                )}

                {/* Team Plan - Contrast card with proper dark mode support */}
                {teamPlan && (
                    <div className="card group card-border contrast-box cursor-pointer p-6" data-theme="dark">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-base-100 rounded-box border-base-300 border p-2.5">
                                    <span className="iconify lucide--users size-5"></span>
                                </div>
                                <div>
                                    <p className="text-base-content/80 text-sm/none italic">Learn together</p>
                                    <p className="mt-0.5 text-xl/none font-medium">Team</p>
                                </div>
                            </div>
                            <div className="text-end text-5xl leading-0">
                                <span className="text-base-content/50 align-super text-xl font-medium">$</span>
                                <span className="font-semibold">{teamPlan.price * teamSeats}</span>
                                <span className="text-base-content/80 text-sm">/month</span>
                            </div>
                        </div>

                        <hr className="border-base-content/20 -mx-6 my-6" />

                        <p className="text-base-content/80 text-sm font-medium">Everything in Pro, plus:</p>
                        <div className="mt-4 grid grid-cols-1 space-y-1 gap-x-8 sm:grid-cols-2">
                            {[
                                "10 base paths + 3 per seat/month",
                                "Shared team workspace",
                                "Team learning paths",
                                "Collaborate on resources",
                                "Team analytics dashboard",
                                "Priority support",
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
                                {teamsEnabled ? (
                                    <ButtonCheckout
                                        priceId={teamPlan.priceId}
                                        mode="subscription"
                                        seatCount={teamSeats}
                                    />
                                ) : (
                                    <button
                                        className="btn btn-primary btn-block group"
                                        disabled
                                    >
                                        Coming Soon
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
