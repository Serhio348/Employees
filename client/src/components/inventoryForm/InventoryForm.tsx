import { Form, Select, DatePicker } from 'antd';
import React, { memo, useState, useEffect } from 'react';
import CustomInput from '../customInput/CustomInput';
import ErrorMessage from '../errorMessage/ErrorMessage';
import CustomButton from '../customButton/CustomButton';
import { useSizNorms } from '../../hooks/useSizNorms';
import dayjs from 'dayjs';
import './InventoryForm.css';

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
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Отслеживаем размер экрана для адаптивности
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            setIsTablet(width <= 1024 && width > 768);
        };
        
        handleResize(); // Вызываем сразу для установки начального состояния
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleFinish = (values: any) => {
        const processedValues = {
            ...values,
            issueDate: values.issueDate ? dayjs(values.issueDate).format('YYYY-MM-DD') : undefined,
            employeeId: employeeId
        };
        onFinish(processedValues);
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
        <div
            className="inventory-form"
            style={{
            width: '100%',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            marginTop: 0
        }}>
            {title && (
                <div style={{ 
                    fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '0 16px',
                    marginTop: 0
                }}>
                    {title}
                </div>
            )}
            
            <Form 
                name='inventory-form' 
                onFinish={handleFinish} 
                initialValues={initialValues}
                layout="vertical"
                size={isMobile ? 'small' : 'middle'}
                style={{ width: '100%', margin: 0 }}
            >
                <Form.Item 
                    name="itemName" 
                    label={
                        <span style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '500'
                        }}>
                            Наименование предмета
                        </span>
                    }
                    rules={[{ required: true, message: 'Выберите наименование предмета' }]}
                    style={{ marginBottom: isMobile ? '12px' : '16px', marginLeft: 0, marginRight: 0 }}
                >
                    <Select
                        placeholder="Выберите наименование предмета"
                        showSearch
                        size={isMobile ? 'small' : 'middle'}
                        style={{
                            fontSize: isMobile ? '12px' : '14px',
                            width: '100%',
                            margin: 0
                        }}
                        filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    >
                        {sizNorms.map(norm => (
                            <Select.Option key={norm.id} value={norm.name}>
                                {norm.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                
                <Form.Item 
                    name="itemType" 
                    label={
                        <span style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '500'
                        }}>
                            Тип предмета
                        </span>
                    }
                    rules={[{ required: true, message: 'Выберите тип предмета' }]}
                    style={{ marginBottom: isMobile ? '12px' : '16px', marginLeft: 0, marginRight: 0 }}
                >
                    <Select
                        placeholder="Тип предмета"
                        size={isMobile ? 'small' : 'middle'}
                        style={{
                            fontSize: isMobile ? '12px' : '14px',
                            width: '100%',
                            margin: 0
                        }}
                        getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    >
                        <Select.Option value="спецодежда">Спецодежда</Select.Option>
                        <Select.Option value="инструмент">Инструмент</Select.Option>
                        <Select.Option value="оборудование">Оборудование</Select.Option>
                        <Select.Option value="сиз">СИЗ</Select.Option>
                    </Select>
                </Form.Item>
                
                <Form.Item 
                    name="issueDate" 
                    label={
                        <span style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '500'
                        }}>
                            Дата выдачи
                        </span>
                    }
                    rules={[{ required: true, message: 'Выберите дату выдачи' }]}
                    style={{ marginBottom: isMobile ? '12px' : '16px', marginLeft: 0, marginRight: 0 }}
                >
                    <DatePicker
                        style={{
                            width: '100%',
                            fontSize: isMobile ? '12px' : '14px',
                            margin: 0
                        }}
                        size={isMobile ? 'small' : 'middle'}
                        format="DD.MM.YYYY"
                        placeholder="Выберите дату выдачи"
                        getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    />
                </Form.Item>
                
                <Form.Item 
                    name="quantity" 
                    label={
                        <span style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '500'
                        }}>
                            Количество
                        </span>
                    }
                    rules={[{ required: true, message: 'Введите количество' }]}
                    style={{ marginBottom: isMobile ? '12px' : '16px', marginLeft: 0, marginRight: 0 }}
                >
                    <CustomInput 
                        type="number" 
                        name='quantity' 
                        placeholder='Количество'
                        style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            width: '100%',
                            margin: 0
                        }}
                    />
                </Form.Item>
                
                <Form.Item 
                    name="status" 
                    label={
                        <span style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            fontWeight: '500'
                        }}>
                            Статус
                        </span>
                    }
                    rules={[{ required: true, message: 'Выберите статус' }]}
                    style={{ marginBottom: isMobile ? '12px' : '16px', marginLeft: 0, marginRight: 0 }}
                >
                    <Select
                        placeholder="Статус"
                        size={isMobile ? 'small' : 'middle'}
                        style={{
                            fontSize: isMobile ? '12px' : '14px',
                            width: '100%',
                            margin: 0
                        }}
                        getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    >
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

                <div style={{ 
                    width: '100%',
                    marginTop: isMobile ? '16px' : '20px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'center' : 'flex-start',
                    gap: isMobile ? '8px' : '12px'
                }}>
                    <ErrorMessage message={error} />
                    <CustomButton 
                        htmlType="submit" 
                        loading={loading}
                        size={isMobile ? 'small' : 'middle'}
                        style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            height: isMobile ? '32px' : '40px',
                            minWidth: isMobile ? '80px' : '100px',
                            width: isMobile ? '100%' : 'auto',
                            margin: 0
                        }}
                    >
                        {btnText}
                    </CustomButton>
                </div>
            </Form>
        </div>
    );
};

export default memo(InventoryForm);