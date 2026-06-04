import { Form, Input } from 'antd'
import { NamePath } from 'antd/es/form/interface'

type Props = {
    name: string;
    placeholder: string;
    dependencies?: NamePath[];
    hasFeedback?: boolean;
    size?: 'small' | 'middle' | 'large';
}

const PasswordInput = ({
    name,
    placeholder,
    dependencies,
    hasFeedback = false,
    size = 'large',
}: Props) => {
    return (
        <Form.Item
            name={name}
            dependencies={dependencies}
            hasFeedback={hasFeedback}
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
            <Input.Password placeholder={placeholder} size={size} style={{ width: '100%' }} />
        </Form.Item>
    )
}

export default PasswordInput;
