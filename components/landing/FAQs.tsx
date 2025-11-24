const faqs1 = [
    {
        question: "How does AI generate learning paths?",
        answer: "Our AI analyzes your chosen topic and skill level to curate a complete learning path with real resources from actual creators. It organizes content into logical sections, estimates time commitments, and ensures a progressive learning experience—all in about 60 seconds.",
    },
    {
        question: "Are the resources AI-generated content?",
        answer: "No! Every resource is a real link to content from actual educators and creators. We don't generate content or create fake resources. This means no hallucinations, no made-up information—just genuine learning materials from the source.",
    },
    {
        question: "What AI models can I use?",
        answer: "Free users access quality models like DeepSeek, Qwen, Kimi, and free Gemini/Llama models. Pro users unlock premium models including Claude Sonnet 4.5, GPT-5, Gemini 3, and premium Perplexity for even better curation.",
    },
    {
        question: "Can I share my learning paths?",
        answer: "Yes! Free tier paths are automatically public and shareable. Pro users can choose to keep paths private or share them publicly. Team plans enable collaborative learning with shared workspaces.",
    },
];

const faqs2 = [
    {
        question: "How many learning paths can I create?",
        answer: "Free users get 1 path per month, Pro users get 10 paths per month, and Team plans start with 20 base paths plus 6 additional paths per team member each month.",
    },
    {
        question: "What's the difference between plans?",
        answer: "Free gets you started with quality AI models and public paths. Pro unlocks premium AI models (Claude, GPT-5, Gemini 3, private paths, and progress tracking (coming soon). Team adds collaboration features, shared workspaces, and team analytics.",
    },
    {
        question: "Can I track my learning progress?",
        answer: "Yes! Pro and Team users can mark resources as complete, add notes, track time spent, and see visual progress bars for each learning path and section.",
    },
    {
        question: "What happens to my paths if I downgrade?",
        answer: "Your existing paths remain accessible, but you won't be able to create new paths beyond the free tier limit (1/month). Private paths will become view-only until you upgrade again.",
    },
];

export const FAQs = () => {
    return (
        <div className="group/section relative z-10 container mx-auto max-w-7xl py-8 md:py-12 lg:py-16 2xl:py-28" id="faq">
            <p className="group-hover/section:text-primary text-base-content/60 text-center text-[12px] font-medium tracking-[1px] uppercase transition-all duration-300 group-hover/section:tracking-[2px]">
                Questions
            </p>

            <h2 className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-2 flex justify-center text-center">
                <p className="text-base-content/80 max-w-lg">
                    Find quick answers to common questions about ViaProto, AI-powered learning paths, and how to get the most from your learning journey.
                </p>
            </div>
            <div>
                <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-2 lg:gap-6 xl:mt-16">
                    <div className="space-y-4 lg:space-y-6">
                        {faqs1.map((faq, index) => (
                            <div className="collapse-arrow group bg-base-200/60 collapse h-fit" key={index}>
                                <input type="checkbox" aria-label="Accordion checkbox" />
                                <div className="collapse-title cursor-pointer font-medium sm:text-lg">
                                    {faq.question}
                                </div>
                                <div className="collapse-content text-base-content/80 -mt-2 text-sm">{faq.answer}</div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 lg:space-y-6">
                        {faqs2.map((faq, index) => (
                            <div className="collapse-arrow group bg-base-200/60 collapse h-fit" key={index}>
                                <input type="checkbox" aria-label="Accordion checkbox" />
                                <div className="collapse-title cursor-pointer font-medium sm:text-lg">
                                    {faq.question}
                                </div>
                                <div className="collapse-content text-base-content/80 -mt-2 text-sm">{faq.answer}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
