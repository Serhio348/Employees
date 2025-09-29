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
    employee?: T;
    loading?: boolean;
}

const EmployeeForm = ({
    onFinish,
    title,
    btnText,
    error,
    employee,
    loading = false
}: Props<Employee>) => {
    const handleFinish = (values: any) => {
        // Простая обработка без сложных преобразований
        onFinish(values);
    };

    return (
        <Card title={title} style={{ width: '30rem' }}>
            <Form name='employee-form' onFinish={handleFinish} initialValues={employee}>
                <CustomInput type="text" name='firstName' placeholder='Имя' />
                <CustomInput type="text" name='lastName' placeholder='Фамилия' />
                <CustomInput type="text" name='surName' placeholder='Отчество' required={false} />
                <CustomInput type="number" name='age' placeholder='Возраст' />
                <CustomInput type="date" name='birthDate' placeholder='Дата рождения' required={false} />
                <CustomInput type="text" name='profession' placeholder='Профессия' />
                <CustomInput type="text" name='address' placeholder='Адрес' />
                <CustomInput type="text" name='employeeNumber' placeholder='Табельный номер' required={false} />
                <CustomInput type="number" name='height' placeholder='Рост (см)' required={false} />
                <CustomInput type="text" name='clothingSize' placeholder='Размер одежды' required={false} />
                <CustomInput type="text" name='shoeSize' placeholder='Размер обуви' required={false} />


                <Space>
                    <ErrorMessage message={error} />
                    <CustomButton htmlType="submit" loading={loading}>
                        {btnText}
                    </CustomButton>
                </Space>
            </Form>
        </Card>
    )

}

export default EmployeeForm