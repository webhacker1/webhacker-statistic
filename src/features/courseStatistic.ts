import type {
    CourseActivityRow,
    CourseStats,
    CourseStepTypeData,
    CourseStructureData,
    NormalizedCourseStats,
    TranslationCourse
} from "../core/types";
import type { ResolvedTheme } from "../core/themes";
import { renderLineChart } from "../charts/lineChart";
import { renderDoughnutChart } from "../charts/doughnutChart";
import { renderBarChart } from "../charts/barChart";

function normalizeActivityData(rawRows: CourseStats["activityData"] | undefined): CourseActivityRow[] {
    if (!Array.isArray(rawRows)) return [];
    return rawRows.map(row => ({
        date: typeof row?.date === "string" ? row.date : "",
        join: Number(row?.join) || 0,
        leave: Number(row?.leave) || 0
    }));
}

function normalizeStepTypeData(rawData: CourseStats["stepTypeData"] | undefined): CourseStepTypeData {
    return {
        text: Number(rawData?.text) || 0,
        video: Number(rawData?.video) || 0,
        test: Number(rawData?.test) || 0,
        blank: Number(rawData?.blank) || 0,
        matching: Number(rawData?.matching) || 0
    };
}

function normalizeStructureData(rawData: CourseStats["structure"] | undefined): CourseStructureData {
    return {
        modules: Number(rawData?.modules) || 0,
        lessons: Number(rawData?.lessons) || 0,
        steps: Number(rawData?.steps) || 0
    };
}

function getNormalizedCourseStats(rawStats: CourseStats | undefined): NormalizedCourseStats {
    return {
        activityData: normalizeActivityData(rawStats?.activityData),
        stepTypeData: normalizeStepTypeData(rawStats?.stepTypeData),
        structure: normalizeStructureData(rawStats?.structure)
    };
}

function toDateLabel(dateString: string): string {
    const dateObject = new Date(`${dateString}T00:00`);
    if (Number.isNaN(dateObject.getTime())) return dateString;
    return dateObject.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function getFilteredDailyRows(
    dailyRows: Array<{ date: Date; join: number; leave: number }>,
    period: string
): Array<{ date: Date; join: number; leave: number }> {
    if (period === "all") {
        return [...dailyRows].sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    const dayCount = Number(period) || 7;
    const cutoffDate = new Date(new Date().setHours(0, 0, 0, 0) - (dayCount - 1) * 864e5);
    return dailyRows
        .filter(row => row.date >= cutoffDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function initCourseStatistic(
    rawStats: CourseStats | undefined,
    rawTranslations: TranslationCourse | undefined,
    theme: ResolvedTheme
): void {
    const statistics = getNormalizedCourseStats(rawStats);
    const translations = {
        text: rawTranslations?.text || "Текст",
        video: rawTranslations?.video || "Видео",
        test: rawTranslations?.test || "Тест",
        blank: rawTranslations?.blank || "Пропуски",
        matching: rawTranslations?.matching || "Сопоставление",
        stat_modules: rawTranslations?.stat_modules || "Модули",
        stat_lessons: rawTranslations?.stat_lessons || "Уроки",
        stat_steps: rawTranslations?.stat_steps || "Шаги"
    };

    const dailyRows = statistics.activityData
        .map(row => ({
            date: new Date(`${row.date}T00:00`),
            join: row.join,
            leave: row.leave
        }))
        .filter(row => !Number.isNaN(row.date.getTime()));

    const lineCanvasElement = document.getElementById("activityChart") as HTMLCanvasElement | null;
    const pieCanvasElement = document.getElementById("stepPie") as HTMLCanvasElement | null;
    const barCanvasElement = document.getElementById("structureBar") as HTMLCanvasElement | null;

    const drawLineByPeriod = (period: string) => {
        if (!lineCanvasElement) return;
        const rows = getFilteredDailyRows(dailyRows, period);

        renderLineChart(
            lineCanvasElement,
            rows.map(row => toDateLabel(row.date.toISOString().slice(0, 10))),
            [
                {
                    identifier: "joined",
                    label: "Записались",
                    values: rows.map(row => row.join),
                    color: theme.lineJoin
                },
                {
                    identifier: "left",
                    label: "Вышли",
                    values: rows.map(row => row.leave),
                    color: theme.lineLeave
                }
            ],
            theme,
            {
                enableLegend: true
            }
        );
    };

    drawLineByPeriod("7");

    document.querySelectorAll(".period-selector .chip").forEach(chipElement => {
        const buttonElement = chipElement as HTMLElement;
        buttonElement.onclick = () => {
            document
                .querySelectorAll(".period-selector .chip")
                .forEach(item => item.classList.remove("active"));
            buttonElement.classList.add("active");
            drawLineByPeriod(buttonElement.dataset.period || "7");
        };
    });

    if (pieCanvasElement) {
        renderDoughnutChart(
            pieCanvasElement,
            [
                statistics.stepTypeData.text,
                statistics.stepTypeData.video,
                statistics.stepTypeData.test,
                statistics.stepTypeData.blank,
                statistics.stepTypeData.matching
            ],
            theme.palette.slice(0, 5),
            theme,
            0.55,
            [
                translations.text,
                translations.video,
                translations.test,
                translations.blank,
                translations.matching
            ],
            {
                valueLabel: "Количество",
                shareLabel: "Доля",
                enableLegend: true
            }
        );
    }

    if (barCanvasElement) {
        renderBarChart(
            barCanvasElement,
            [translations.stat_modules, translations.stat_lessons, translations.stat_steps],
            [
                statistics.structure.modules,
                statistics.structure.lessons,
                statistics.structure.steps
            ],
            theme,
            {
                valueLabel: "Количество",
                enableLegend: true
            }
        );
    }
}
