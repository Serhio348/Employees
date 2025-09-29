import { Card, Form, Space, DatePicker, InputNumber } from 'antd';
import React, { useCallback, memo } from 'react';
import CustomInput from '../customInput/CustomInput';
import ErrorMessage from '../errorMessage/ErrorMessage';
import CustomButton from '../customButton/CustomButton';
import dayjs from 'dayjs';

interface InventoryAddon {
    id?: string;
    name: string;
    issueDate: string;
    wearPeriodMonths: number;
    nextReplacementDate: string;
    inventoryId: string;
}

type Props = {
    onFinish: (values: InventoryAddon) => void;
    btnText: string;
    title: string;
    error?: string;
    addon?: InventoryAddon;
    inventoryId?: string;
    loading?: boolean;
};

const InventoryAddonForm = ({
    onFinish,
    title,
    btnText,
    error,
    addon,
    inventoryId,
    loading = false
}: Props) => {
    const [form] = Form.useForm();

    const handleFinish = (values: any) => {
        // Обрабатываем даты для отправки на сервер
        const processedValues = {
            ...values,
            issueDate: values.issueDate ? dayjs(values.issueDate).format('YYYY-MM-DD') : undefined,
            nextReplacementDate: values.nextReplacementDate ? dayjs(values.nextReplacementDate).format('YYYY-MM-DD') : undefined,
        };
        
        onFinish(processedValues);
    };

    // Упрощенная обработка без сложных вычислений
    const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
        // Простая проверка без сложной логики
        if (changedValues.issueDate && changedValues.wearPeriodMonths) {
            try {
                const issueDate = allValues.issueDate;
                const wearPeriodMonths = allValues.wearPeriodMonths;
                
                if (issueDate && wearPeriodMonths) {
                    const nextReplacementDate = dayjs(issueDate).add(wearPeriodMonths, 'month');
                    form.setFieldsValue({ nextReplacementDate });
                }
            } catch (error) {
                console.error('Date calculation error:', error);
            }
        }
    }, [form]);

    return (
        <Card title={title} style={{ width: '30rem' }}>
            <Form 
                name='inventory-addon-form' 
                onFinish={handleFinish} 
                initialValues={addon}
                form={form}
                onValuesChange={handleValuesChange}
            >
                <CustomInput type="text" name='name' placeholder='Наименование дополнения' />
                
                <Form.Item 
                    name="issueDate" 
                    label="Дата выдачи"
                    rules={[{ required: true, message: 'Выберите дату выдачи' }]}
                >
                    <DatePicker 
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                        placeholder="Выберите дату выдачи"
                    />
                </Form.Item>
                
                <Form.Item 
                    name="wearPeriodMonths" 
                    label="Срок носки (месяцы)"
                    rules={[{ required: true, message: 'Введите срок носки' }]}
                >
                    <InputNumber 
                        style={{ width: '100%' }}
                        placeholder="Введите срок носки в месяцах"
                        min={1}
                        max={120}
                    />
                </Form.Item>
                
                <Form.Item 
                    name="nextReplacementDate" 
                    label="Дата следующей замены"
                >
                    <DatePicker 
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                        placeholder="Дата следующей замены (вычисляется автоматически)"
                        disabled
                    />
                </Form.Item>
                
                {inventoryId && (
                    <Form.Item name="inventoryId" initialValue={inventoryId} style={{ display: 'none' }}>
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

export default memo(InventoryAddonForm);
