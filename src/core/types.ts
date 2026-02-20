export type StatisticAnswer = {
    answer: string;
    voteCount: number;
};

export type StatisticData = {
    countPasses: number;
    countCorrectPasses: number;
    answers: StatisticAnswer[];
};

export type CourseActivityRow = {
    date: string;
    join: number;
    leave: number;
};

export type CourseStepTypeData = {
    text: number;
    video: number;
    test: number;
    blank: number;
    matching: number;
};

export type CourseStructureData = {
    modules: number;
    lessons: number;
    steps: number;
};

export type CourseStats = {
    activityData: CourseActivityRow[];
    stepTypeData: CourseStepTypeData;
    structure: CourseStructureData;
};

export type TranslationCourse = {
    text: string;
    video: string;
    test: string;
    blank: string;
    matching: string;
    stat_modules: string;
    stat_lessons: string;
    stat_steps: string;
};

export type NormalizedCourseStats = {
    activityData: CourseActivityRow[];
    stepTypeData: CourseStepTypeData;
    structure: CourseStructureData;
};
