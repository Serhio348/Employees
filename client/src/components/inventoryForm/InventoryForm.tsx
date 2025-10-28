import { Form, Select, DatePicker } from 'antd';
import React, { memo, useState, useEffect } from 'react';
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
        <div style={{
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

            <style>
                {`
                    /* Стили для формы в модальном окне */
                    .ant-form {
                        margin: 0 !important;
                        padding: 0 !important;
                        margin-top: 0 !important;
                    }
                    
                    .ant-form-item {
                        margin: 0 0 16px 0 !important;
                        padding: 0 !important;
                        margin-top: 0 !important;
                    }
                    
                    .ant-form-item:first-child {
                        margin-top: 0 !important;
                    }
                    
                    .ant-form-item-label {
                        margin: 0 !important;
                        padding: 0 0 4px 0 !important;
                    }
                    
                    .ant-form-item-control {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .ant-form-item-control-input {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .ant-select, .ant-picker, .ant-input {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .ant-select-selector, .ant-picker-input {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Отступы и размер текста для placeholder */
                    .ant-select-selector {
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                        height: 40px !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    
                    .ant-select-selection-placeholder {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                        font-size: 14px !important;
                        color: #bfbfbf !important;
                        line-height: 1.4 !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    
                    .ant-picker-input {
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                        height: 40px !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    
                    .ant-picker-input input {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                        font-size: 14px !important;
                        line-height: 1.4 !important;
                        height: auto !important;
                        border: none !important;
                        background: transparent !important;
                    }
                    
                    .ant-picker-input input::placeholder {
                        font-size: 14px !important;
                        color: #bfbfbf !important;
                        line-height: 1.4 !important;
                    }
                    
                    .ant-input {
                        padding-left: 8px !important;
                        padding-right: 8px !important;
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                        font-size: 14px !important;
                        line-height: 1.4 !important;
                        height: 40px !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    
                    .ant-input::placeholder {
                        font-size: 14px !important;
                        color: #bfbfbf !important;
                        line-height: 1.4 !important;
                    }
                    
                    /* Дополнительные стили для выравнивания текста */
                    .ant-select-selection-item {
                        display: flex !important;
                        align-items: center !important;
                        line-height: 1.4 !important;
                    }
                    
                    .ant-select-selection-search {
                        display: flex !important;
                        align-items: center !important;
                    }
                    
                    .ant-select-selection-search-input {
                        height: auto !important;
                        line-height: 1.4 !important;
                    }
                    
                    /* Адаптивные стили для формы в модальном окне */
                    @media (max-width: 768px) {
                        .ant-form-item-label > label { 
                            font-size: 12px !important; 
                            font-weight: 500 !important; 
                        }
                        .ant-select-selector, .ant-picker, .ant-input { 
                            font-size: 12px !important; 
                            height: 32px !important;
                        }
                        
                        /* Отступы и размер текста для мобильных устройств */
                        .ant-select-selector {
                            padding-left: 6px !important;
                            padding-right: 6px !important;
                            padding-top: 4px !important;
                            padding-bottom: 4px !important;
                            height: 32px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .ant-select-selection-placeholder {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            font-size: 12px !important;
                            color: #bfbfbf !important;
                            line-height: 1.4 !important;
                        }
                        
                        .ant-picker-input {
                            padding-left: 6px !important;
                            padding-right: 6px !important;
                            padding-top: 4px !important;
                            padding-bottom: 4px !important;
                            height: 32px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .ant-picker-input input {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            font-size: 12px !important;
                            line-height: 1.4 !important;
                        }
                        
                        .ant-picker-input input::placeholder {
                            font-size: 12px !important;
                            color: #bfbfbf !important;
                            line-height: 1.4 !important;
                        }
                        
                        .ant-input {
                            padding-left: 6px !important;
                            padding-right: 6px !important;
                            padding-top: 4px !important;
                            padding-bottom: 4px !important;
                            font-size: 12px !important;
                            line-height: 1.4 !important;
                            height: 32px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .ant-input::placeholder {
                            font-size: 12px !important;
                            color: #bfbfbf !important;
                            line-height: 1.4 !important;
                        }
                        .ant-btn { 
                            font-size: 12px !important; 
                            height: 32px !important; 
                        }
                        .ant-form-item { 
                            margin-bottom: 12px !important; 
                        }
                    }
                    @media (min-width: 769px) and (max-width: 1024px) {
                        .ant-form-item-label > label { 
                            font-size: 14px !important; 
                        }
                        .ant-select-selector, .ant-picker, .ant-input { 
                            font-size: 14px !important; 
                        }
                        
                        /* Отступы и размер текста для планшетов */
                        .ant-select-selector {
                            padding-left: 8px !important;
                            padding-right: 8px !important;
                            padding-top: 4px !important;
                            padding-bottom: 4px !important;
                            height: 40px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .ant-select-selection-placeholder {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            font-size: 14px !important;
                            color: #bfbfbf !important;
                            line-height: 1.4 !important;
                        }
                        
                        .ant-picker-input {
                            padding-left: 8px !important;
                            padding-right: 8px !important;
                            padding-top: 4px !important;
                            padding-bottom: 4px !important;
                            height: 40px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .ant-picker-input input {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            font-size: 14px !important;
                            line-height: 1.4 !important;
                        }
                        
                        .ant-picker-input input::placeholder {
                            font-size: 14px !important;
                            color: #bfbfbf !important;
                            line-height: 1.4 !important;
                        }
                        
                        .ant-input {
                            padding-left: 8px !important;
                            padding-right: 8px !important;
                            padding-top: 4px !important;
                            padding-bottom: 4px !important;
                            font-size: 14px !important;
                            line-height: 1.4 !important;
                            height: 40px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .ant-input::placeholder {
                            font-size: 14px !important;
                            color: #bfbfbf !important;
                            line-height: 1.4 !important;
                        }
                        .ant-btn { 
                            font-size: 14px !important; 
                        }
                        .ant-form-item { 
                            margin-bottom: 16px !important; 
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default memo(InventoryForm);