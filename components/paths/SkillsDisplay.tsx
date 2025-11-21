"use client";

import { Variants, motion } from "motion/react";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface Competency {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface TopicCompetency {
  is_primary: boolean;
  competency: Competency;
}

interface SkillsDisplayProps {
  competencies: TopicCompetency[];
}

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: (i) => ({
    opacity: 0,
    x: i % 3 === 0 ? -50 : i % 3 === 2 ? 50 : 0,
    y: 50,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 12, duration: 0.8 },
  },
};

export const SkillsDisplay = ({ competencies }: SkillsDisplayProps) => {
  if (!competencies || competencies.length === 0) {
    return null;
  }

  return (
    <div className="group/section overflow-visible py-8 md:py-12 lg:py-16">
      <div className="flex items-center justify-center gap-1.5">
        <div className="bg-primary/80 h-4 w-0.5 translate-x-1.5 rounded-full opacity-0 transition-all group-hover/section:translate-x-0 group-hover/section:opacity-100" />
        <p className="text-base-content/60 group-hover/section:text-primary font-mono text-sm font-medium transition-all">
          What You'll Learn
        </p>
        <div className="bg-primary/80 h-4 w-0.5 -translate-x-1.5 rounded-full opacity-0 transition-all group-hover/section:translate-x-0 group-hover/section:opacity-100" />
      </div>
      <p className="mt-2 text-center text-2xl font-semibold sm:text-3xl">Skills Covered</p>
      <div className="mt-2 flex justify-center text-center">
        <p className="text-base-content/80 max-w-lg">
          This learning path will help you develop these core competencies
        </p>
      </div>
      <motion.div
        className="relative mt-8 grid grid-cols-1 gap-6 md:mt-12 md:grid-cols-2 lg:mt-16 xl:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}>
        {competencies.map((tc, index) => {
          const comp = tc.competency;
          if (!comp) return null;

          return (
            <motion.div
              className="card group bg-base-100 relative cursor-pointer overflow-hidden p-6 shadow"
              custom={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
              key={comp.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-medium">{comp.name}</p>
                </div>
                {tc.is_primary && (
                  <span className="badge badge-primary badge-sm">Primary</span>
                )}
              </div>
              {comp.description && (
                <p className="text-base-content/80 line-clamp-2 text-sm mt-3">
                  {comp.description}
                </p>
              )}
              {comp.icon && (
                <Icon
                  icon={comp.icon}
                  className="absolute -end-2 -bottom-2 size-20 opacity-20 bg-transparent grayscale transition-all duration-300 group-hover:opacity-20 group-hover:grayscale-0"
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA to track competencies */}
      <div className="mt-8 text-center md:mt-12">
        <div className="alert alert-info inline-flex max-w-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-left">
            <p className="text-sm">
              Want personalized paths based on your current skills?{" "}
              <Link href="/skills" className="link link-primary font-medium">
                Track your competencies
              </Link>{" "}
              to get recommendations tailored to your proficiency level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
