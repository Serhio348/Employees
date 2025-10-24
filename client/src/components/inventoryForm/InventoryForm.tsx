import { Card, Form, Space, Select, DatePicker } from 'antd';
import React, { memo } from 'react';
import CustomInput from '../customInput/CustomInput';
import ErrorMessage from '../errorMessage/ErrorMessage';
import CustomButton from '../customButton/CustomButton';
import { useSizNorms } from '../../hooks/useSizNorms';
import dayjs from 'dayjs';

interface InventoryItem {
    id?: string;
    itemName: string;
    itemType: string;
    issueDate?: string;
    quantity: number;
    status: string;
    employeeId: string;
}

type Props = {
    onFinish: (values: InventoryItem) => void;
    btnText: string;
    title: string;
    error?: string;
    item?: InventoryItem;
    employeeId?: string;
    loading?: boolean;
};

const InventoryForm = ({
    onFinish,
    title,
    btnText,
    error,
    item,
    employeeId,
    loading = false
}: Props) => {
    const { sizNorms } = useSizNorms();

    const handleFinish = (values: any) => {
        console.log('InventoryForm - received values:', values);
        const processedValues = {
            ...values,
            issueDate: values.issueDate ? dayjs(values.issueDate).format('YYYY-MM-DD') : undefined,
            employeeId: employeeId
        };
        console.log('InventoryForm - processed values:', processedValues);
        onFinish(processedValues);
        // Принудительно очищаем форму после отправки
        setTimeout(() => {
            // Форма будет очищена автоматически при закрытии модального окна
        }, 100);
    };

    const initialValues = item ? {
        itemName: item.itemName,
        itemType: item.itemType,
        issueDate: item.issueDate ? dayjs(item.issueDate) : undefined,
        quantity: item.quantity,
        status: item.status
    } : {
        quantity: 1,
        status: 'выдан'
    };

    return (
        <Card title={title} style={{ width: '30rem' }}>
            <Form name='inventory-form' onFinish={handleFinish} initialValues={initialValues}>
                <Form.Item name="itemName" rules={[{ required: true, message: 'Выберите наименование предмета' }]}>
                    <Select 
                        placeholder="Выберите наименование предмета" 
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {sizNorms.map(norm => (
                            <Select.Option key={norm.id} value={norm.name}>
                                {norm.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                
                <Form.Item name="itemType" rules={[{ required: true, message: 'Выберите тип предмета' }]}>
                    <Select placeholder="Тип предмета">
                        <Select.Option value="спецодежда">Спецодежда</Select.Option>
                        <Select.Option value="инструмент">Инструмент</Select.Option>
                        <Select.Option value="оборудование">Оборудование</Select.Option>
                        <Select.Option value="сиз">СИЗ</Select.Option>
                    </Select>
                </Form.Item>
                
                <Form.Item name="issueDate" label="Дата выдачи" rules={[{ required: true, message: 'Выберите дату выдачи' }]}>
                    <DatePicker
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                        placeholder="Выберите дату выдачи"
                    />
                </Form.Item>
                
                <Form.Item name="quantity" rules={[{ required: true, message: 'Введите количество' }]}>
                    <CustomInput type="number" name='quantity' placeholder='Количество' />
                </Form.Item>
                
                <Form.Item name="status" rules={[{ required: true, message: 'Выберите статус' }]}>
                    <Select placeholder="Статус">
                        <Select.Option value="выдан">Выдан</Select.Option>
                        <Select.Option value="возвращен">Возвращен</Select.Option>
                        <Select.Option value="списан">Списан</Select.Option>
                    </Select>
                </Form.Item>
                
                {employeeId && (
                    <Form.Item name="employeeId" initialValue={employeeId} style={{ display: 'none' }}>
                        <input type="hidden" />
                    </Form.Item>
                )}

                <Space>
                    <ErrorMessage message={error} />
                    <CustomButton htmlType="submit" loading={loading}>
                        {btnText}
                    </CustomButton>
                </Space>
            </Form>
        </Card>
    );
};

export default memo(InventoryForm);