import React, {ReactElement, SVGProps} from 'react'

type IconChild = ReactElement<SVGProps<SVGElement>>

type Props = {
    children: IconChild | IconChild[]
    width?: number | string
    height?: number | string
} & SVGProps<SVGSVGElement>

const CustomIconWrapper = (props: Props) => {
    const {children, width, height} = props

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}
        >
            {/* The shapes of an icon take the colour of the text whatever their own attributes say. */}
            {/* eslint-disable-next-line @eslint-react/no-children-map */}
            {React.Children.map(children, (child: IconChild) => {
                // eslint-disable-next-line @eslint-react/no-clone-element
                return React.cloneElement(child, {
                    stroke: 'currentColor',
                    fill: 'none',
                })
            })}
        </svg>
    )
}

export default CustomIconWrapper
