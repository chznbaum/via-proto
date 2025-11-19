const features = [
    {
        icon: <span className="iconify lucide--sparkles size-5.5"></span>,
        keyMetric: "10+ Models",
        badge: "Your Choice",
        title: "Multiple AI Models",
        description: "Free users access quality models from DeepSeek, Qwen, and others. Pro users unlock Claude, GPT-4, and premium models.",
    },
    {
        icon: <span className="iconify lucide--shield-check size-5.5"></span>,
        keyMetric: "100%",
        badge: "No Hallucinations",
        title: "Real, Verified Resources",
        description: "Every resource is a real link from actual creators. No AI-generated content means no hallucinations or made-up information.",
    },
    {
        icon: <span className="iconify lucide--users size-5.5"></span>,
        keyMetric: "Direct",
        badge: "Support Creators",
        title: "Links to Real Educators",
        description: "Every path links directly to the original creator's content. Support educators and access high-quality learning materials from the source.",
    },
    {
        icon: <span className="iconify lucide--zap size-5.5"></span>,
        keyMetric: "60s",
        badge: "Lightning Fast",
        title: "Instant Personalization",
        description: "AI curates a complete learning path with resources, structure, and progression in just 60 seconds. Start learning immediately.",
    },
    {
        icon: <span className="iconify lucide--line-chart size-5.5"></span>,
        keyMetric: "Pro",
        badge: "Track Progress",
        title: "Learning Analytics",
        description: "Pro users can track progress, mark resources complete, and see how far they've come on their learning journey.",
    },
    {
        icon: <span className="iconify lucide--user-round-plus size-5.5"></span>,
        keyMetric: "Team",
        badge: "Collaborate",
        title: "Share with Your Team",
        description: "Team plans let you share curated learning paths with colleagues, ensuring everyone learns from the same high-quality resources.",
    },
];

export const Features = () => {
    return (
        <div
            className="group/section relative z-10 container mx-auto max-w-7xl scroll-mt-12 py-8 md:py-12 lg:py-16 2xl:py-28"
            id="features">
            <p className="group-hover/section:text-primary text-base-content/60 text-center text-[12px] font-medium tracking-[1px] uppercase transition-all duration-300 group-hover/section:tracking-[2px]">
                Why ViaProto
            </p>
            <p className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Learn from Real Creators</p>
            <div className="mt-2 flex justify-center text-center">
                <p className="text-base-content/80 max-w-lg">
                    We don't generate content or steal traffic from educators. Every resource links directly to the creator,
                    supporting the people who make learning possible.
                </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 xl:mt-16 xl:grid-cols-3 xl:gap-8">
                {features.map((item, index) => (
                    <div
                        key={index}
                        className="card group card-border bg-base-100 hover:bg-base-200/20 cursor-pointer p-4 transition-all sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-box border-base-200 bg-base-200/40 border p-2.5">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-primary text-lg/none">{item.keyMetric}</p>
                                <p className="text-base-content/80 mt-1.5 text-sm/none">{item.badge}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-lg font-medium">{item.title}</p>
                        <p className="text-base-content/70 mt-1 line-clamp-3 text-sm">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
