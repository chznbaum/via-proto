"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
// @ts-ignore
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { ThemeToggle } from "@/components/ThemeToggle";
import ButtonSignin from "./ButtonSignin";
import config from "@/config";

const menu = [
    {
        title: "Home",
        href: "#home",
    },
    {
        title: "Features",
        href: "#features",
    },
    {
        title: "Pricing",
        href: "#pricing",
    },
    {
        title: "FAQ",
        href: "#faq",
    },
] as const;

export const Topbar = () => {
    const [scrollPosition, setScrollPosition] = useState<number>(0);

    const handleScroll = useCallback(() => {
        setScrollPosition(window.scrollY);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    return (
        <div
            className="group fixed start-0 end-0 top-0 z-20 flex md:top-4 md:justify-center"
            data-at-top={scrollPosition < 30}>
            <div className="md:bg-base-100 bg-base-100/90 flex h-16 items-center gap-6 px-4 backdrop-blur-xs transition-all duration-500 group-data-[at-top=false]:shadow group-data-[at-top=true]:bg-transparent hover:group-data-[at-top=false]:shadow-lg max-md:grow max-md:justify-between md:rounded-full md:px-8 lg:gap-12 xl:gap-20">
                <div className="flex items-center gap-2">
                    <div className="md:hidden">
                        <div className="drawer">
                            <input id="navigation-drawer" type="checkbox" className="drawer-toggle" />
                            <div className="drawer-content">
                                <label
                                    htmlFor="navigation-drawer"
                                    className="btn btn-sm btn-ghost btn-square drawer-button">
                                    <span className="iconify lucide--menu size-5"></span>
                                </label>
                            </div>
                            <div className="drawer-side">
                                <label
                                    htmlFor="navigation-drawer"
                                    aria-label="close sidebar"
                                    className="drawer-overlay"></label>
                                <div className="bg-base-100 flex h-screen w-64 flex-col px-3 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <Link href="/" className="flex items-center gap-2">
                                            <span className="font-serif text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                                ViaPro.to
                                            </span>
                                        </Link>
                                    </div>
                                    <div className="min-h-0 grow">
                                        <SimpleBar className="mt-5 size-full">
                                            <p className="text-base-content/60 mx-3 text-sm font-medium">Navigation</p>
                                            <ul className="menu mt-1 w-full p-0">
                                                {menu.map((item, index) => (
                                                    <li key={index}>
                                                        <Link
                                                            href={item.href ?? ""}
                                                            className="hover:bg-base-200 rounded-box block px-3 py-1.5 text-sm">
                                                            {item.title}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="divider mx-3"></div>
                                            <div className="px-3">
                                                <ButtonSignin extraStyle="btn-primary btn-block" />
                                            </div>
                                        </SimpleBar>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <span className="font-serif text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            ViaPro.to
                        </span>
                    </Link>
                </div>
                <div className="hidden items-center gap-1 md:flex">
                    {menu.map((item, index) => (
                        <Link
                            href={item.href ?? ""}
                            className="hover:bg-base-200 rounded-box block px-3 py-1.5 text-sm"
                            key={index}>
                            {item.title}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle className="btn btn-circle btn-sm btn-ghost" />
                    <div className="max-md:hidden">
                        <ButtonSignin extraStyle="btn-primary btn-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
};
