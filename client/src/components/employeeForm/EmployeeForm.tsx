import { Employee } from '@prisma/client';
import { Card, Form, Space } from 'antd';
import React from 'react'
import CustomInput from '../customInput/CustomInput';
import ErrorMessage from '../errorMessage/ErrorMessage';
import CustomButton from '../customButton/CustomButton';

type Props<T> = {
    onFinish: (values: T) => void;
    btnText: string;
    title: string;
    error?: string;
    employee?: T
}

const EmployeeForm = ({
    onFinish,
    title,
    btnText,
    error,
    employee

}: Props<Employee>) => {
    return (
        <Card title={title} style={{ width: '30rem' }}>
            <Form name='employee-form' onFinish={onFinish} initialValues={employee}>
                <CustomInput type="text" name='firstName' placeholder='Имя' />
                <CustomInput type="text" name='lastName' placeholder='Фамилия' />
                <CustomInput type="text" name='surName' placeholder='Отчество' />
                <CustomInput type="namber" name='age' placeholder='Возраст' />
                <CustomInput type="text" name='address' placeholder='Адрес' />
                <CustomInput type="text" name='profession' placeholder='Профессия' />
                <CustomInput type="text" name='tableNumber' placeholder='Табельный номер' />
                <Space>
                    <ErrorMessage message={error} />
                    <CustomButton htmlType="submit">
                        {btnText}
                    </CustomButton>
                </Space>
            </Form>
        </Card>
    )

}

export default EmployeeForm