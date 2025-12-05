"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { createClient } from "@/libs/supabase/client";
import type { SearchEngineId } from "@/libs/search-engines";

export const themes = ["light", "contrast", "material", "dark", "dim", "material-dark", "system"] as const;

export type ITheme = (typeof themes)[number];

export type IConfig = {
    theme: ITheme;
    direction: "ltr" | "rtl";
    sidebarTheme: "light" | "dark";
    fontFamily: "fixel" | "atkinson" | "geist" | "figtree";
    fullscreen: boolean;
    searchEngine: SearchEngineId;
};

const defaultConfig: IConfig = {
    theme: "system",
    direction: "ltr",
    fontFamily: "fixel",
    sidebarTheme: "light",
    fullscreen: false,
    searchEngine: "duckduckgo",
};

const useHook = () => {
    const [config, setConfig] = useLocalStorage<IConfig>("__VIAPROTO_CONFIG__", defaultConfig);
    const [userId, setUserId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const htmlRef = useMemo(() => typeof window !== "undefined" && document.documentElement, []);
    const supabase = createClient();

    // Load preferences from DB for logged-in users on mount
    useEffect(() => {
        const initializePreferences = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);

                // Fetch preferences from database
                const { data: preferences } = await supabase
                    .from('user_preferences')
                    .select('theme, font_family, direction, sidebar_theme, preferred_search_engine')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (preferences) {
                    // Map DB column names to config keys
                    const dbConfig: Partial<IConfig> = {
                        theme: preferences.theme as ITheme,
                        fontFamily: preferences.font_family as IConfig['fontFamily'],
                        direction: preferences.direction as IConfig['direction'],
                        sidebarTheme: preferences.sidebar_theme as IConfig['sidebarTheme'],
                        searchEngine: preferences.preferred_search_engine as SearchEngineId,
                    };

                    // Merge DB preferences with local storage (DB takes precedence)
                    setConfig({ ...config, ...dbConfig });
                }
            }

            setIsInitialized(true);
        };

        initializePreferences();
    }, []);

    const updateConfig = async (changes: Partial<IConfig>) => {
        const newConfig = { ...config, ...changes };
        setConfig(newConfig);

        // Sync to database if user is logged in
        if (userId) {
            // Map config keys to DB column names (exclude fullscreen as it's not persisted to DB)
            const dbChanges: any = {};
            if (changes.theme !== undefined) dbChanges.theme = changes.theme;
            if (changes.fontFamily !== undefined) dbChanges.font_family = changes.fontFamily;
            if (changes.direction !== undefined) dbChanges.direction = changes.direction;
            if (changes.sidebarTheme !== undefined) dbChanges.sidebar_theme = changes.sidebarTheme;
            if (changes.searchEngine !== undefined) dbChanges.preferred_search_engine = changes.searchEngine;

            // Only sync if there are DB-relevant changes
            if (Object.keys(dbChanges).length > 0) {
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: userId,
                        ...dbChanges,
                    }, {
                        onConflict: 'user_id'
                    });
            }
        }
    };

    const changeTheme = (theme: IConfig["theme"]) => {
        updateConfig({ theme });
    };

    const changeSidebarTheme = (sidebarTheme: IConfig["sidebarTheme"]) => {
        updateConfig({ sidebarTheme });
    };
    const changeFontFamily = (fontFamily: IConfig["fontFamily"]) => {
        updateConfig({ fontFamily });
    };

    const changeDirection = (direction: IConfig["direction"]) => {
        updateConfig({ direction });
    };

    const changeSearchEngine = (searchEngine: IConfig["searchEngine"]) => {
        updateConfig({ searchEngine });
    };

    const toggleTheme = () => {
        if (["system", "light", "contrast", "material"].includes(config.theme)) {
            changeTheme("dark");
        } else {
            changeTheme("light");
        }
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement != null) {
            document.exitFullscreen();
        } else if (htmlRef) {
            htmlRef.requestFullscreen();
        }
        updateConfig({ fullscreen: !config.fullscreen });
    };

    const reset = async () => {
        setConfig(defaultConfig);
        if (document.fullscreenElement != null) {
            document.exitFullscreen();
        }

        // Reset DB preferences for logged-in users
        if (userId) {
            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    theme: defaultConfig.theme,
                    font_family: defaultConfig.fontFamily,
                    direction: defaultConfig.direction,
                    sidebar_theme: defaultConfig.sidebarTheme,
                    preferred_search_engine: defaultConfig.searchEngine,
                }, {
                    onConflict: 'user_id'
                });
        }
    };

    const calculatedSidebarTheme = useMemo(() => {
        return config.sidebarTheme == "dark" && ["light", "contrast"].includes(config.theme) ? "dark" : undefined;
    }, [config.sidebarTheme, config.theme]);

    useEffect(() => {
        const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");
        const fullscreenListener = () => {
            updateConfig({ fullscreen: fullscreenMedia.matches });
        };
        fullscreenMedia.addEventListener("change", fullscreenListener);

        return () => {
            fullscreenMedia.removeEventListener("change", fullscreenListener);
        };
    }, [config]);

    useEffect(() => {
        if (!htmlRef) return;
        if (config.theme == "system") {
            htmlRef.removeAttribute("data-theme");
        } else {
            htmlRef.setAttribute("data-theme", config.theme);
        }
        if (config.fullscreen) {
            htmlRef.setAttribute("data-fullscreen", "");
        } else {
            htmlRef.removeAttribute("data-fullscreen");
        }
        if (config.sidebarTheme) {
            htmlRef.setAttribute("data-sidebar-theme", config.sidebarTheme);
        }
        if (JSON.stringify(config) !== JSON.stringify(defaultConfig)) {
            htmlRef.setAttribute("data-changed", "");
        } else {
            htmlRef.removeAttribute("data-changed");
        }
        if (config.fontFamily) {
            htmlRef.setAttribute("data-font-family", config.fontFamily);
        }
        if (config.direction) {
            htmlRef.dir = config.direction;
        }
    }, [config, htmlRef]);

    return {
        config,
        calculatedSidebarTheme,
        toggleTheme,
        reset,
        changeSidebarTheme,
        changeFontFamily,
        changeTheme,
        changeDirection,
        changeSearchEngine,
        toggleFullscreen,
    };
};

const ConfigContext = createContext({} as ReturnType<typeof useHook>);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    return <ConfigContext value={useHook()}>{children}</ConfigContext>;
};

export const useConfig = () => {
    return useContext(ConfigContext);
};
