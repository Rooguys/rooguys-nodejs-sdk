import fc from 'fast-check';
/**
 * Property-based testing generators for SDK inputs
 */
export declare const arbitraries: {
    userId: () => fc.Arbitrary<string>;
    eventName: () => fc.Arbitrary<string>;
    properties: () => fc.Arbitrary<Record<string, string | number | boolean | null>>;
    timeframe: () => fc.Arbitrary<string>;
    pagination: () => fc.Arbitrary<{
        page: number;
        limit: number;
    }>;
    ahaValue: () => fc.Arbitrary<number>;
    invalidAhaValue: () => fc.Arbitrary<number>;
    uuid: () => fc.Arbitrary<string>;
    slug: () => fc.Arbitrary<string>;
    userIds: () => fc.Arbitrary<string[]>;
    activeOnly: () => fc.Arbitrary<boolean>;
    searchQuery: () => fc.Arbitrary<string | null>;
    baseUrl: () => fc.Arbitrary<string>;
    timeout: () => fc.Arbitrary<number>;
    apiKey: () => fc.Arbitrary<string>;
    questionnaireAnswers: () => fc.Arbitrary<{
        question_id: string;
        answer_option_id: string;
    }[]>;
};
