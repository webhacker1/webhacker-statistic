import "./styles/widget.less";
import { resolveTheme } from "./core/themes";
import { initCourseStatistic } from "./features/courseStatistic";
import { initTestStatistic } from "./features/testStatistic";
import type { CourseStats, StatisticData, TranslationCourse } from "./core/types";

type WidgetApi = {
    initStatistic: () => void;
    statisticTest: (containerElement: Element) => void;
};

const RENDER_STATE: {
    courseInitialized: boolean;
    testInitialized: boolean;
    testContainerElement: Element | null;
    themeObserver: MutationObserver | null;
    scheduled: number | null;
} = {
    courseInitialized: false,
    testInitialized: false,
    testContainerElement: null,
    themeObserver: null,
    scheduled: null
};

function readWindowData(): {
    courseStats: CourseStats | undefined;
    statData: Partial<StatisticData> | undefined;
    translations: TranslationCourse | undefined;
} {
    const windowData = window as Window & {
        courseStats?: CourseStats;
        statData?: Partial<StatisticData>;
        translations?: { course?: TranslationCourse };
    };

    return {
        courseStats: windowData.courseStats,
        statData: windowData.statData,
        translations: windowData.translations?.course
    };
}

function rerenderAllCharts(): void {
    const theme = resolveTheme();
    const { courseStats, statData, translations } = readWindowData();

    if (RENDER_STATE.courseInitialized) {
        initCourseStatistic(courseStats, translations, theme);
    }

    if (RENDER_STATE.testInitialized && RENDER_STATE.testContainerElement) {
        initTestStatistic(RENDER_STATE.testContainerElement, statData, theme);
    }
}

function scheduleRerender(): void {
    if (RENDER_STATE.scheduled !== null) {
        cancelAnimationFrame(RENDER_STATE.scheduled);
        RENDER_STATE.scheduled = null;
    }

    RENDER_STATE.scheduled = requestAnimationFrame(() => {
        RENDER_STATE.scheduled = null;
        rerenderAllCharts();
    });
}

function ensureThemeObserver(): void {
    if (RENDER_STATE.themeObserver) return;

    const observer = new MutationObserver(() => {
        scheduleRerender();
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class", "data-theme", "theme"]
    });

    if (document.body) {
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["style", "class", "data-theme", "theme"]
        });
    }

    window.addEventListener("resize", () => scheduleRerender());

    RENDER_STATE.themeObserver = observer;
}

function initStatistic(): void {
    const theme = resolveTheme();
    const { courseStats, translations } = readWindowData();
    initCourseStatistic(courseStats, translations, theme);
    RENDER_STATE.courseInitialized = true;
    ensureThemeObserver();
}

function statisticTest(containerElement: Element): void {
    const theme = resolveTheme();
    const { statData } = readWindowData();
    initTestStatistic(containerElement, statData, theme);
    RENDER_STATE.testInitialized = true;
    RENDER_STATE.testContainerElement = containerElement;
    ensureThemeObserver();
}

const widgetApi: WidgetApi = {
    initStatistic,
    statisticTest
};

declare global {
    interface Window {
        WebHackerStatistics: WidgetApi;
        initStatistic: () => void;
        statisticTest: (containerElement: Element) => void;
    }
}

if (typeof window !== "undefined") {
    window.WebHackerStatistics = widgetApi;
    window.initStatistic = initStatistic;
    window.statisticTest = statisticTest;
}

export { initStatistic, statisticTest, widgetApi };
