"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";

export const Hero = () => {
    const [stats, setStats] = useState({ publicPaths: 0, topics: 0 });

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

            console.log('Stats fetched:', { pathsCount, topicsCount });

            setStats({
                publicPaths: pathsCount || 0,
                topics: topicsCount || 0
            });
        };

        fetchStats();
    }, []);

    return (
        <div className="relative mx-auto max-w-7xl" id="home">
            <div className="relative z-2 container pt-24 pb-8 md:pt-28 lg:pt-32 lg:pb-16 xl:pt-40 xl:pb-20 2xl:pt-44 2xl:pb-24">
                <div className="grid gap-8 sm:gap-10 xl:grid-cols-2 xl:gap-12 2xl:gap-16">
                    <div className="flex flex-col items-center xl:mt-6 xl:items-start">
                        <div className="hover:bg-success/5 border-success/60 text-success inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs transition-all">
                            <p>AI-Powered Learning Curation</p>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                            </svg>
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
                        <div className="mt-6 flex items-center gap-3 lg:mt-8">
                            <Link
                                href="/dashboard"
                                className="text-primary-content from-primary rounded-box group to-secondary animate-background-shift btn btn-lg relative cursor-pointer gap-2.5 border-0 bg-gradient-to-r bg-[length:200%_200%]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                </svg>
                                <p>Learn Something New</p>
                                <div className="from-primary to-secondary animate-background-shift absolute inset-x-0 top-1.5 -z-1 h-full bg-gradient-to-r bg-[length:200%_200%] opacity-60 blur-md transition-all duration-300 group-hover:top-2 group-hover:opacity-80 group-hover:blur-lg"></div>
                            </Link>
                            <Link href="/explore" className="btn btn-lg btn-ghost gap-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                </svg>
                                Browse Shared Paths
                            </Link>
                        </div>
                        <div className="mt-8 space-y-1 md:mt-10 xl:mt-12">
                            <div className="flex items-center gap-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                                <p className="text-base-content/80 max-sm:text-sm">
                                    Curated from real creators—no AI-generated content
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                                <p className="text-base-content/80 max-sm:text-sm">
                                    Links directly to sources—support the educators you learn from
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                                <p className="text-base-content/80 max-sm:text-sm">
                                    Multiple AI models to choose from—free and premium options
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative px-4">
                        <div className="from-primary/80 to-secondary/70 bg-gradient-to-r rounded-xl p-1 sm:p-2 lg:p-3">
                            {/* OBVIOUS PLACEHOLDER - Replace with actual dashboard screenshot */}
                            <div className="h-56 w-full rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center sm:h-80 md:h-128">
                                <div className="text-center p-8">
                                    <p className="text-4xl font-black text-white mb-4">📸</p>
                                    <p className="text-2xl font-bold text-white mb-2">REPLACE THIS</p>
                                    <p className="text-lg text-white/90">Dashboard Screenshot Goes Here</p>
                                </div>
                            </div>
                        </div>

                        {/* Top-right popout: Generating path */}
                        <div className="card bg-base-100 absolute -end-0 top-16 w-60 p-3 shadow-md hover:shadow-lg max-lg:hidden sm:p-4 xl:-end-12 2xl:-end-32">
                            <p className="text-base-content/60 text-sm">
                                Generate path for <span className="cursor-pointer underline">React Hooks</span>
                            </p>
                            <p className="mt-0.5 font-medium">Curating resources…</p>
                            <div className="mt-1.5 flex flex-col gap-1.5">
                                <div className="rounded-box skeleton h-3 w-[50%]"></div>
                                <div className="rounded-box skeleton h-3 w-[75%]"></div>
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-2">
                                <div className="tooltip" data-tip="In Process">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 animate-spin text-base-content/60">
                                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <button className="btn btn-sm btn-error gap-2 border-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Bottom-left popout: Path shared */}
                        <div className="card bg-base-100 absolute start-0 bottom-16 w-60 p-3 shadow-md hover:shadow-lg max-lg:hidden sm:p-4 xl:-start-32 animate-bounce" style={{ animationDuration: '3s' }}>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <button className="btn btn-sm btn-soft ms-auto gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                                    </svg>
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-8 md:mt-16 lg:grid-cols-4 lg:gap-6 xl:mt-20 2xl:mt-24">
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">{stats.publicPaths.toLocaleString()}+</p>
                        <p className="text-base-content/60 max-sm:text-sm">Public Learning Paths</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">{stats.topics.toLocaleString()}+</p>
                        <p className="text-base-content/60 max-sm:text-sm">Topics Available</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">60s</p>
                        <p className="text-base-content/60 max-sm:text-sm">Average Path Generation</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-3xl font-semibold">100%</p>
                        <p className="text-base-content/60 max-sm:text-sm">Real Creator Content</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
