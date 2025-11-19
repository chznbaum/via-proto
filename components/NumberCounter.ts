type EasingFunction = (t: number) => number;

const EASINGS: { [key: string]: EasingFunction } = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

export class NumberCounter {
    private readonly element: HTMLElement;
    private readonly target: number;
    private readonly duration: number;
    private readonly start: number;
    private readonly interval: number;
    private readonly easing: EasingFunction;
    private started: boolean = false;
    private readonly finalText: string;

    constructor(element: HTMLElement) {
        this.element = element;
        this.target = this.getNumberAttr("target", 100);
        this.duration = this.getNumberAttr("duration", 2000);
        this.start = this.getNumberAttr("start", 0);
        this.interval = this.getNumberAttr("interval", 1);
        const easingName = this.element.getAttribute("data-easing") || "linear";
        this.easing = EASINGS[easingName] || EASINGS.linear;
        this.finalText = this.element.getAttribute("data-final-text") || "";

        const triggerOnView = this.getBoolAttr("trigger-on-view", false);

        if (triggerOnView) {
            this.observeVisibility();
        } else {
            this.startCounter();
        }
    }

    private getNumberAttr(attr: string, defaultValue: number): number {
        const val = this.element.getAttribute(`data-${attr}`);
        const num = Number(val);
        return val && !isNaN(num) ? num : defaultValue;
    }

    private getBoolAttr(attr: string, defaultValue: boolean): boolean {
        const val = this.element.getAttribute(`data-${attr}`);
        if (val === null) return defaultValue;
        return val === "true" || val === "1";
    }

    private startCounter() {
        if (this.started) return;
        this.started = true;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            const easedProgress = this.easing(progress);

            // Calculate raw interpolated value
            let value = this.start + easedProgress * (this.target - this.start);

            if (!isFinite(value)) value = this.target; // fallback fix

            // Round to nearest multiple of interval, safe fallback to avoid NaN
            const displayedValue = this.interval > 0 ? Math.round(value / this.interval) * this.interval : value;

            this.element.textContent = displayedValue.toFixed(this.getDecimalPlaces(this.interval));

            if (progress < 1) {
                window.requestAnimationFrame(animate);
            } else {
                this.element.textContent = this.finalText || this.target.toFixed(this.getDecimalPlaces(this.interval));
            }
        };

        window.requestAnimationFrame(animate);
    }

    private getDecimalPlaces(num: number): number {
        const decimalPart = num.toString().split(".")[1];
        return decimalPart ? decimalPart.length : 0;
    }

    private observeVisibility() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.startCounter();
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 },
        );
        observer.observe(this.element);
    }
}
