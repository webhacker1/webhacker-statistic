import "./styles/widget.less";
import { resolveTheme } from "./core/themes";
import { initCourseStatistic } from "./features/courseStatistic";
import { initTestStatistic } from "./features/testStatistic";
import type { CourseStats, StatisticData, TranslationCourse } from "./core/types";

type WidgetApi = {
    initStatistic: () => void;
    statisticTest: (containerElement: Element) => void;
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

function initStatistic(): void {
    const theme = resolveTheme();
    const { courseStats, translations } = readWindowData();
    initCourseStatistic(courseStats, translations, theme);
}

function statisticTest(containerElement: Element): void {
    const theme = resolveTheme();
    const { statData } = readWindowData();
    initTestStatistic(containerElement, statData, theme);
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
