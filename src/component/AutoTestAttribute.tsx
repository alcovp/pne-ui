const TEST_ATTRIBUTE_NAME = 'data-autotest';
const TEST_ATTRIBUTE_VALUE_NAME = 'data-autotest-value';

export type AutoTestValue = string | number | boolean

export type AutoTestAttributes = {
    [TEST_ATTRIBUTE_NAME]: string
    [TEST_ATTRIBUTE_VALUE_NAME]?: AutoTestValue
}

/**
 * Creates always-on, non-secret locator attributes for direct attachment to the
 * DOM node or MUI slot that owns the tested interaction.
 */
export const createAutoTestAttributes = (
    id: string,
    value?: AutoTestValue,
): AutoTestAttributes => value === undefined
    ? {[TEST_ATTRIBUTE_NAME]: id}
    : {
        [TEST_ATTRIBUTE_NAME]: id,
        [TEST_ATTRIBUTE_VALUE_NAME]: value,
    }
