"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/libs/supabase/client";
import { NumberCounter } from "@/components/NumberCounter";
import { trackEvent } from "@/components/SwetrixAnalytics";

export const Hero = () => {
    const [stats, setStats] = useState({ publicPaths: 0, topics: 0, competencies: 0 });
    const counter1Ref = useRef<HTMLSpanElement | null>(null);
    const counter2Ref = useRef<HTMLSpanElement | null>(null);
    const counter3Ref = useRef<HTMLSpanElement | null>(null);
    const counter4Ref = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();

            // Get public paths count
            const { count: pathsCount, error: pathsError } = await supabase
                .from('learning_paths')
                .select('*', { count: 'exact', head: true })
                .eq('is_public', true);

            if (pathsError) {
                console.error('Error fetching paths count:', pathsError);
            }

            // Get topics count
            const { count: topicsCount, error: topicsError } = await supabase
                .from('topics')
                .select('*', { count: 'exact', head: true });

            if (topicsError) {
                console.error('Error fetching topics count:', topicsError);
            }

            // Get competencies count
            const { count: competenciesCount, error: competenciesError } = await supabase
                .from('competencies')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (competenciesError) {
                console.error('Error fetching competencies count:', competenciesError);
            }

            console.log('Stats fetched:', { pathsCount, topicsCount, competenciesCount });

            setStats({
                publicPaths: pathsCount || 0,
                topics: topicsCount || 0,
                competencies: competenciesCount || 0
            });
        };

        fetchStats();
    }, []);

    useEffect(() => {
        if (counter1Ref.current && stats.publicPaths > 0) {
            new NumberCounter(counter1Ref.current);
        }
    }, [stats.publicPaths]);

    useEffect(() => {
        if (counter2Ref.current && stats.topics > 0) {
            new NumberCounter(counter2Ref.current);
        }
    }, [stats.topics]);

    useEffect(() => {
        if (counter3Ref.current && stats.competencies > 0) {
            new NumberCounter(counter3Ref.current);
        }
    }, [stats.competencies]);

    useEffect(() => {
        if (counter4Ref.current) {
            new NumberCounter(counter4Ref.current);
        }
    }, []);

    return (
        <div className="relative mx-auto max-w-7xl" id="home">
            <div className="relative z-2 pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
                <div className="grid gap-8 sm:gap-10 xl:grid-cols-2 xl:gap-12 2xl:gap-16">
                    <div className="flex flex-col items-center xl:mt-6 xl:items-start">
                        <div className="hover:bg-success/5 border-success/60 text-success inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs transition-all">
                            <p>AI-Curated Learning Paths</p>
                            <span className="iconify lucide--arrow-right inline-block size-3.5"></span>
                        </div>
                        <h1 className="mt-3 text-3xl leading-tight font-extrabold transition-all duration-1000 lg:text-4xl xl:text-5xl 2xl:text-6xl">
                            Get ahead while
                            <br />
                            <span className="relative">
                                <span className="rounded-box from-primary/10 to-primary/5 absolute -inset-x-2 inset-y-0 bg-gradient-to-r"></span>
                                <span className="text-primary relative">others fall behind</span>
                            </span>
                        </h1>
                        <p className="text-base-content/80 mt-4 max-w-xl max-xl:text-center max-sm:text-sm md:text-lg">
                            Get a complete, personalized learning path in 60 seconds. Everything you need to master any skill,
                            curated from real creators and organized just for you.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 lg:mt-8">
                            <Link
                                href="/dashboard"
                                className="text-primary-content from-primary rounded-box group to-secondary animate-background-shift btn sm:btn-lg relative cursor-pointer gap-2.5 border-0 bg-linear-to-r bg-[200%,200%]"
                                onClick={() => trackEvent("cta.hero.learn_something_new")}
                            >
                                <span className="iconify lucide--rocket start-1 bottom-1 size-4.5"></span>
                                <p>Learn Something New</p>
                                <div className="from-primary to-secondary animate-background-shift absolute inset-x-0 top-1.5 -z-1 h-full bg-linear-to-r bg-[200%,200%] opacity-60 blur-md transition-all duration-300 group-hover:top-2 group-hover:opacity-80 group-hover:blur-lg"></div>
                            </Link>
                            <Link
                                href="/explore"
                                className="btn sm:btn-lg btn-ghost gap-2.5"
                                onClick={() => trackEvent("cta.hero.browse_shared_paths")}
                            >
                                <span className="iconify lucide--search size-4.5"></span>
                                Browse Shared Paths
                            </Link>
                        </div>
                        <div className="mt-8 space-y-1 md:mt-10 xl:mt-12">
                            <div className="flex items-center gap-2.5">
                                <span className="iconify lucide--check min-w-4"></span>
                                <p className="text-base-content/80 max-sm:text-sm">
                                    Links directly to real creators—no AI-generated content
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="iconify lucide--check min-w-4"></span>
                                <p className="text-base-content/80 max-sm:text-sm">
                                  Doesn’t take the “good struggle” out of learning
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="iconify lucide--check min-w-4"></span>
                                <p className="text-base-content/80 max-sm:text-sm">
                                  Learn <strong>anything</strong> all in one place
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative px-4 py-24 lg:py-0">
                        <div className="from-primary/80 to-secondary/70 bg-gradient-to-r rounded-xl p-1 sm:p-2 lg:p-3">
                            <img
                                src="/images/dashboard-screenshot.png"
                                alt="ViaProto Dashboard"
                                className="w-full rounded-lg"
                            />
                        </div>

                        {/* Top-right popout: Generating path */}
                        <div className="card bg-base-100 absolute -end-0 top-0 lg:top-16 w-60 p-3 shadow-md hover:shadow-lg sm:p-4 xl:-end-12 2xl:-end-32">
                            <p className="text-base-content/60 text-sm">
                                Generate path for <span className="cursor-pointer underline">Conversational Spanish</span>
                            </p>
                            <p className="mt-0.5 font-medium">Curating resources…</p>
                            <div className="mt-1.5 flex flex-col gap-1.5">
                                <div className="rounded-box skeleton h-3 w-[50%]"></div>
                                <div className="rounded-box skeleton h-3 w-[75%]"></div>
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-2">
                                <div className="tooltip" data-tip="In Process">
                                    <span className="iconify lucide--loader size-4 animate-spin text-base-content/60"></span>
                                </div>
                                <button className="btn btn-sm btn-error gap-2 border-none">
                                    <span className="iconify lucide--x size-4"></span>
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Bottom-left popout: Path shared */}
                        <div className="card bg-base-100 absolute start-0 bottom-0 lg:bottom-16 w-60 p-3 shadow-md hover:shadow-lg sm:p-4 xl:-start-32 motion-preset-oscillate motion-duration-3000">
                            <p className="text-base-content/60 text-sm">Share "Python Automation" with Team</p>
                            <p className="mt-1 font-medium">Path shared successfully</p>
                            <div className="avatar-group -space-x-3 py-1 *:border-2 *:transition-all hover:space-x-0.5 hover:*:shadow-sm">
                                <div className="avatar bg-gradient-to-br from-blue-400 to-blue-600 size-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    JD
                                </div>
                                <div className="avatar bg-gradient-to-br from-purple-400 to-purple-600 size-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    SK
                                </div>
                                <div className="avatar bg-gradient-to-br from-green-400 to-green-600 size-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    AL
                                </div>
                                <div className="avatar bg-base-200 flex size-8 items-center justify-center overflow-hidden rounded-full text-xs font-medium">
                                    +4
                                </div>
                            </div>
                            <div className="mt-2 flex items-end gap-2">
                                <div
                                    className="bg-success/10 tooltip text-success flex items-center rounded-full p-0.5"
                                    data-tip="Shared successfully">
                                    <span className="iconify lucide--check size-3.5"></span>
                                </div>
                                <button className="btn btn-sm btn-soft ms-auto gap-2">
                                    <span className="iconify lucide--copy size-4"></span>
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-8 md:mt-16 lg:grid-cols-4 lg:gap-6 xl:mt-20 2xl:mt-24">
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">
                            <span data-target={stats.publicPaths} data-duration="2500" ref={counter1Ref} data-trigger-on-view>
                                0
                            </span>+
                        </p>
                        <p className="text-base-content/60 max-sm:text-sm">Public Learning Paths</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">
                            <span data-target={stats.topics} data-duration="2500" ref={counter2Ref} data-trigger-on-view>
                                0
                            </span>+
                        </p>
                        <p className="text-base-content/60 max-sm:text-sm">Topics Available</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">
                            <span data-target={stats.competencies} data-duration="2500" ref={counter3Ref} data-trigger-on-view>
                                0
                            </span>+
                        </p>
                        <p className="text-base-content/60 max-sm:text-sm">Skills to Learn</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">
                            <span data-target="100" data-duration="2000" data-final-text="100%" ref={counter4Ref} data-trigger-on-view>
                                0
                            </span>
                        </p>
                        <p className="text-base-content/60 max-sm:text-sm">Real Creator Content</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
