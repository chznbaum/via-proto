import { useCallback, useEffect, useState } from "react";

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.warn(`Error loading localStorage key "${key}":`, error);
        }
    }, [key]);

    const setValue = useCallback(
        (value: T) => {
            try {
                setStoredValue(value);
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(value));
                }
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key],
    );

    return [storedValue, setValue] as const;
};
