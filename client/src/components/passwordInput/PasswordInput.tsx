import React from 'react'
import { Form } from 'antd'
import { Input } from 'antd'
import { NamePath } from 'antd/es/form/interface'

type Props = {
    name: string;
    placeholder: string;
    dependencies?: NamePath[];
}

const PasswordInput = ({
    name,
    placeholder,
    dependencies
}: Props) => {
    return (
        <Form.Item
            name={name}
            dependencies={dependencies}
            hasFeedback={true}
            rules={[
                {
                    required: true, 
                    message: 'Обязательное поле'
                },
                ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
                    validator(_: any, value: string) {
                        if (!value) {
                            return Promise.resolve()
                        }
                        if (name === "confirmPassword") {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve()
                            }
                            return Promise.reject(new Error('Пароли должны совпадать'))
                        } else {
                            if (value.length < 6) {
                                return Promise.reject(new Error('Пароль должен иметь не менее 6 символов'))
                            }
                            return Promise.resolve()
                        }
                    }
                })
            ]}
        >
            {React.createElement(Input, {
                type: "password",
                placeholder: placeholder,
                size: "large"
            })}
        </Form.Item>
    )
}

export default PasswordInput;