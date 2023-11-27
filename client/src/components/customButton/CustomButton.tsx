/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Button, Form } from "antd";

type Props = {
    children: React.ReactNode;
    htmlType?: "button" | "submit" | "reset" | undefined;
    type?:
    | "link"
    | "text"
    | "ghost"
    | "default"
    | "primary"
    | "dashed"
    | undefined;
    onClick?: () => void;
    danger?: boolean;
    loading?: boolean;
    shape?: "default" | "circle" | "round";
    icon?: React.ReactNode;
};

const CustomButton = ({
    children,
    htmlType = "button",
    type,
    danger,
    loading,
    shape,
    icon,
    onClick,
}: Props) => {
    return (
        <Form.Item>
            <Button
                htmlType={htmlType}
                type={type}
                danger={danger}
                loading={loading}
                shape={shape}
                icon={icon}
                onClick={onClick}
            >
                {children}
            </Button>
        </Form.Item >
    );
};

export default CustomButton;
