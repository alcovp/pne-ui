import React from 'react';

const TEST_ATTRIBUTE_NAME = 'data-autotest';
const TEST_ATTRIBUTE_VALUE_NAME = 'data-autotest-value';

export type AutoTestValue = string | number | boolean

export type AutoTestAttributes = {
    [TEST_ATTRIBUTE_NAME]: string
    [TEST_ATTRIBUTE_VALUE_NAME]?: AutoTestValue
}

export type AutoTestAttributeProps = React.PropsWithChildren<{
    id: string
    value?: AutoTestValue
}>

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

/**
 * Compatibility API for existing consumers. Custom children must forward
 * unknown DOM attributes. A Fragment child is wrapped in a div for legacy
 * compatibility, so new library code should use createAutoTestAttributes on an
 * existing DOM node or MUI slot instead.
 */
export const AutoTestAttribute = (props: AutoTestAttributeProps) => {
    const {
        id,
        value,
        children,
    } = props;

    const attributes = createAutoTestAttributes(id, value);

    const withTestAttribute = (nodes: React.ReactNode): React.ReactNode => {
        const node = React.Children.only(nodes);

        if (!React.isValidElement<Record<string, unknown>>(node)) {
            return node;
        }

        if (node.type === React.Fragment) {
            return React.createElement(
                'div',
                attributes,
                node
            );
        }

        return React.cloneElement(node, attributes);
    }

    return <>
        {withTestAttribute(children)}
    </>
};
