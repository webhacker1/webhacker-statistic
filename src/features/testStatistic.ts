import type { StatisticData } from "../core/types";
import type { ResolvedTheme } from "../core/themes";
import { renderDoughnutChart } from "../charts/doughnutChart";
import { renderRadarChart } from "../charts/radarChart";

function getNormalizedStatisticData(rawData: Partial<StatisticData> | undefined): StatisticData {
    return {
        countPasses: Number(rawData?.countPasses) || 0,
        countCorrectPasses: Number(rawData?.countCorrectPasses) || 0,
        answers: Array.isArray(rawData?.answers)
            ? rawData.answers.map(answer => ({
                  answer:
                      typeof (answer as { answer?: unknown }).answer === "string"
                          ? (answer as { answer: string }).answer
                          : "Без названия",
                  voteCount:
                      Number((answer as { voteCount?: unknown; vote_count?: unknown }).voteCount) ||
                      Number((answer as { vote_count?: unknown }).vote_count) ||
                      0
              }))
            : []
    };
}

export function initTestStatistic(
    containerElement: Element,
    rawData: Partial<StatisticData> | undefined,
    theme: ResolvedTheme
): void {
    const data = getNormalizedStatisticData(rawData);
    const successCanvasElement = containerElement.querySelector(
        "#successRatioChart"
    ) as HTMLCanvasElement | null;
    const radarCanvasElement = containerElement.querySelector(
        "#answersRadarChart"
    ) as HTMLCanvasElement | null;

    const totalPasses = data.countPasses;
    const correctPasses = data.countCorrectPasses;
    const failedPasses = Math.max(0, totalPasses - correctPasses);

    if (successCanvasElement) {
        const values = totalPasses === 0 ? [1] : [correctPasses, failedPasses];
        const colors = totalPasses === 0 ? ["#d0dae8"] : [theme.success, theme.danger];
        const labels = totalPasses === 0 ? ["Нет данных"] : ["Успешно", "Неуспешно"];

        renderDoughnutChart(successCanvasElement, values, colors, theme, 0.58, labels, {
            valueLabel: "Количество",
            shareLabel: "Процент",
            enableLegend: true
        });
    }

    if (radarCanvasElement) {
        const hasAnswers = data.answers.length > 0;
        const labels = hasAnswers ? data.answers.map(answer => answer.answer) : ["Нет данных"];
        const values = hasAnswers ? data.answers.map(answer => answer.voteCount) : [1];
        const colors = hasAnswers
            ? data.answers.map((_, index) => theme.palette[index % theme.palette.length])
            : ["#c7d6ea"];

        renderRadarChart(radarCanvasElement, labels, values, colors, theme, {
            valueLabel: "Голоса"
        });
    }
}
