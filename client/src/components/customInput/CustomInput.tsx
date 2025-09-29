import React from "react";
import { Form, Input } from "antd";


type Props = {
    name: string,
    placeholder: string,
    type?: string,
    required?: boolean
}

const CustomInput = ({
    name,
    placeholder,
    type = "text",
    required = true
}: Props) => {
    return (
        <Form.Item
            rules={required ? [{ required: true, message: 'Обязательное поле' }] : []}
            name={name}
        >
            <Input
                placeholder={placeholder}
                type={type}
                size="large"
            />
        </Form.Item>
    );
};

export default CustomInput;
