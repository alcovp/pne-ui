import React, {ReactElement} from 'react';
import ReactIs from 'react-is';

const DATA_ATTRIBUTE_SUFFIX = 'autotest';
const DATA_ATTRIBUTE_VALUE_SUFFIX = 'autotest-value';
const TEST_ATTRIBUTE_NAME = `data-${DATA_ATTRIBUTE_SUFFIX}`;
const TEST_ATTRIBUTE_VALUE_NAME = `data-${DATA_ATTRIBUTE_VALUE_SUFFIX}`;

interface IProps {
    id: string
    value?: valueType
}

type valueType = string | number | boolean

export const AutoTestAttribute = (props: React.PropsWithChildren<IProps>) => {
    const {
        id,
        value,
        children,
    } = props;

    const isProduction = process.env.PUBLIC_AUTOTEST_ATTRIBUTES === 'false';

    const withTestAttribute = (nodes: React.ReactNode): React.ReactNode => {
        const node = React.Children.only(nodes);

        if (ReactIs.isFragment(node)) {
            return React.createElement(
                'div',
                // @ts-expect-error TS2345
                addValueAttributeIfPresent({[TEST_ATTRIBUTE_NAME]: id}, value),
                node
            );
        } else if (ReactIs.isElement(node)) {
            return React.cloneElement(
                node as ReactElement,
                // @ts-expect-error TS2345
                addValueAttributeIfPresent({[TEST_ATTRIBUTE_NAME]: id}, value)
            );
        } else {
            console.log('node');
            return node;
        }
    }

    return <>
        {isProduction ? children : withTestAttribute(children)}
    </>
};

const addValueAttributeIfPresent = (
    attributes: Record<string, valueType>,
    value: valueType
): Record<string, valueType> => {
    return value !== undefined ? {...attributes, [TEST_ATTRIBUTE_VALUE_NAME]: value} : attributes;
}
