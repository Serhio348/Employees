import React from "react";
import { Input, Form } from "antd";

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
        <Form.Item
            name={name}
            rules={[
                {
                    required: required,
                    message: 'Пожалуйста заполните обязательные поля'
                },
                ...(type === "email" ? [{
                    type: "email" as const,
                    message: "Введите корректный email"
                }] : [])
            ]}
        >
            <Input
                placeholder={placeholder}
                type={type}
                size={size}
                style={style}
            />
        </Form.Item>
    );
};

export default CustomInput;
