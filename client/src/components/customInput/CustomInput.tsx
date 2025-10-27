import React from "react";
import { Input } from "antd";

type Props = {
    name: string,
    placeholder: string,
    type?: string,
    required?: boolean,
    size?: 'small' | 'middle' | 'large',
    style?: React.CSSProperties
}

const CustomInput = ({
    name,
    placeholder,
    type = "text",
    required = true,
    size = "large",
    style
}: Props) => {
    return (
        <Input
            placeholder={placeholder}
            type={type}
            size={size}
            style={style}
        />
    );
};

export default CustomInput;
