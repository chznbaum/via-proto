"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";

export const themes = ["light", "dark", "system"] as const;

export type ITheme = (typeof themes)[number];

type IConfig = {
    theme: ITheme;
};

const defaultConfig: IConfig = {
    theme: "system",
};

const useHook = () => {
    const [config, setConfig] = useLocalStorage<IConfig>("__VIAPROTO_CONFIG__", defaultConfig);

    const htmlRef = useMemo(() => typeof window !== "undefined" && document.documentElement, []);

    const updateConfig = (changes: Partial<IConfig>) => {
        setConfig({ ...config, ...changes });
    };

    const toggleTheme = () => {
        changeTheme(config.theme === "light" ? "dark" : config.theme === "dark" ? "system" : "light");
    };

    useEffect(() => {
        if (htmlRef && config !== defaultConfig) {
            if (config.theme == "system") {
                htmlRef.removeAttribute("data-theme");
            } else {
                htmlRef.setAttribute("data-theme", config.theme);
            }
        }
    }, [config, htmlRef]);

    const changeTheme = (theme: IConfig["theme"]) => {
        updateConfig({ theme });
    };

    const reset = () => {
        setConfig(defaultConfig);
    };

    return {
        config,
        reset,
        changeTheme,
        toggleTheme,
    };
};

const ConfigContext = createContext({} as ReturnType<typeof useHook>);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    return <ConfigContext value={useHook()}>{children}</ConfigContext>;
};

export const useConfig = () => {
    return useContext(ConfigContext);
};
