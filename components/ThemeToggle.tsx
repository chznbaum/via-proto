"use client";

import { ComponentProps } from "react";

import { useConfig } from "@/contexts/config";

type ThemeToggleProps = {
    iconClass?: string;
} & ComponentProps<"button">;

export const ThemeToggle = ({ iconClass, className, ...props }: ThemeToggleProps) => {
    const { toggleTheme } = useConfig();

    return (
        <button
            {...props}
            className={`relative overflow-hidden ${className ?? ""}`}
            onClick={() => toggleTheme()}
            aria-label="Toggle Theme">
            <span
                className={`iconify lucide--sun absolute size-4.5 -translate-y-4 opacity-0 transition-all duration-300 group-data-[theme=light]/html:translate-y-0 group-data-[theme=light]/html:opacity-100 ${iconClass ?? ""}`}
            />
            <span
                className={`iconify lucide--moon absolute size-4.5 translate-y-4 opacity-0 transition-all duration-300 group-data-[theme=dark]/html:translate-y-0 group-data-[theme=dark]/html:opacity-100 ${iconClass ?? ""}`}
            />
            <span
                className={`iconify lucide--monitor absolute size-4.5 translate-x-4 opacity-0 transition-all duration-300 group-[&:not([data-theme])]/html:translate-x-0 group-[&:not([data-theme])]/html:opacity-100 ${iconClass ?? ""}`}
            />
        </button>
    );
};
