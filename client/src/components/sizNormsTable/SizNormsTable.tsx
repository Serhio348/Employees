import React, { memo, useState, useEffect } from 'react';
import { Table, Tag, Button, Form, Input, Select, message, Row, Col, Dropdown, Menu } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, MoreOutlined, CloseOutlined } from '@ant-design/icons';
import * as Dialog from '@radix-ui/react-dialog';
import { ColumnsType } from 'antd/es/table';
import { useSizNorms, SizNorm } from '../../hooks/useSizNorms';

const SizNormsTable = () => {
    const { sizNorms, isLoading, addNorm, updateNorm, deleteNorm, initDefaults } = useSizNorms();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingNorm, setEditingNorm] = useState<SizNorm | null>(null);
    const [form] = Form.useForm();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleAdd = () => {
        setEditingNorm(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (norm: SizNorm) => {
        setEditingNorm(norm);
        form.setFieldsValue(norm);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNorm(id);
            message.success('Норма СИЗ удалена');
        } catch (error) {
            message.error('Ошибка при удалении нормы СИЗ');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingNorm && editingNorm.id) {
                // Редактирование
                await updateNorm(editingNorm.id, values);
                message.success('Норма СИЗ обновлена');
            } else {
                // Добавление
                await addNorm(values);
                message.success('Норма СИЗ добавлена');
            }
            setIsModalVisible(false);
            setEditingNorm(null);
            form.resetFields();
        } catch (error) {
            message.error('Ошибка при сохранении нормы СИЗ');
        }
    };

    const handleInitDefaults = async () => {
        try {
            await initDefaults();
            message.success('Стандартные нормы СИЗ инициализированы');
        } catch (error) {
            message.error('Ошибка при инициализации стандартных норм');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingNorm(null);
    };

    const columns: ColumnsType<SizNorm> = [
        {
            title: 'Наименование СИЗ',
            dataIndex: 'name',
            key: 'name',
            width: isMobile ? undefined : 200,
            render: (text: string, record: SizNorm) => (
                <div style={{ 
                    fontWeight: 'bold',
                    fontSize: isMobile ? '12px' : '14px',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                }}>
                    {text}
                    {isMobile && (
                        <div style={{ 
                            marginTop: '4px',
                            fontSize: '10px',
                            color: '#666',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px'
                        }}>
                            {record.classification && (
                                <Tag 
                                    color={record.classification === 'Тн' ? 'blue' : 
                                          record.classification === 'ЗМи' ? 'green' : 
                                          record.classification === 'Ми' ? 'orange' : 
                                          record.classification === 'В' ? 'purple' : 
                                          record.classification === 'Вн' ? 'red' : 
                                          record.classification === 'ЗП' ? 'cyan' : 'default'}
                                    style={{ fontSize: '9px', margin: '1px' }}
                                >
                                    {record.classification}
                                </Tag>
                            )}
                            <span style={{ fontSize: '10px' }}>
                                {record.periodType === 'until_worn' ? 'до износа' : `${record.period} мес.`}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        ...(isMobile ? [] : [
            {
                title: 'Классификация (маркировка)',
                dataIndex: 'classification',
                key: 'classification',
                width: 150,
                render: (classification: string) => {
                    if (!classification) return '-';
                    const color = classification === 'Тн' ? 'blue' : 
                                classification === 'ЗМи' ? 'green' : 
                                classification === 'Ми' ? 'orange' : 
                                classification === 'В' ? 'purple' : 
                                classification === 'Вн' ? 'red' : 
                                classification === 'ЗП' ? 'cyan' : 'default';
                    return <Tag color={color}>{classification}</Tag>;
                }
            },
            {
                title: 'Срок носки',
                dataIndex: 'period',
                key: 'period',
                width: 120,
                align: 'center' as const,
                render: (period: string, record: SizNorm) => {
                    if (record.periodType === 'until_worn') {
                        return <Tag color="red">до износа</Tag>;
                    }
                    return `${period} мес.`;
                }
            }
        ]),
        {
            title: isMobile ? '' : 'Действия',
            key: 'actions',
            width: isMobile ? 60 : 120,
            align: 'center' as const,
            render: (_: any, record: SizNorm) => {
                if (isMobile) {
                    const menu = (
                        <Menu>
                            <Menu.Item 
                                key="edit" 
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            >
                                Редактировать
                            </Menu.Item>
                            <Menu.Item 
                                key="delete" 
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => record.id && handleDelete(record.id)}
                            >
                                Удалить
                            </Menu.Item>
                        </Menu>
                    );

                    return (
                        <Dropdown 
                            overlay={menu} 
                            trigger={['click']}
                            placement="bottomRight"
                            overlayStyle={{
                                position: 'fixed',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 1050
                            }}
                        >
                            <Button 
                                type="text" 
                                icon={<MoreOutlined />}
                                size="small"
                                style={{ fontSize: '12px' }}
                            />
                        </Dropdown>
                    );
                }

                return (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => record.id && handleDelete(record.id)}
                        />
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '14px' : '16px',
                    marginBottom: isMobile ? '12px' : '0',
                    textAlign: isMobile ? 'center' : 'left'
                }}>
                    Нормы выдачи СИЗ
                </div>
                
                {/* Кнопки в столбец на мобильных */}
                <Row gutter={[8, 8]}>
                    <Col span={isMobile ? 24 : 12}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleInitDefaults}
                            size={isMobile ? "small" : "middle"}
                            style={{ 
                                width: isMobile ? '100%' : 'auto',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                        >
                            {isMobile ? 'Стандартные' : 'Инициализировать стандартные'}
                        </Button>
                    </Col>
                    <Col span={isMobile ? 24 : 12}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            size={isMobile ? "small" : "middle"}
                            style={{ 
                                width: isMobile ? '100%' : 'auto',
                                fontSize: isMobile ? '12px' : '14px'
                            }}
                        >
                            {isMobile ? 'Добавить' : 'Добавить норматив'}
                        </Button>
                    </Col>
                </Row>
            </div>
            
            <div style={{ 
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                width: '100%',
                maxWidth: '100%'
            }}>
                <Table
                    columns={columns}
                    dataSource={sizNorms}
                    rowKey="id"
                    pagination={false}
                    size={isMobile ? "small" : "middle"}
                    scroll={isMobile ? { y: 250 } : { x: 800, y: 400 }}
                    loading={isLoading}
                    style={{
                        minWidth: isMobile ? '100%' : '800px',
                        width: '100%',
                        fontSize: isMobile ? '11px' : '14px'
                    }}
                />
            </div>
            
            <Dialog.Root
                open={isModalVisible}
                onOpenChange={(open) => { if (!open) handleModalCancel(); }}
            >
                <Dialog.Portal>
                    <Dialog.Overlay
                        className="radix-dialog-overlay"
                        style={{ zIndex: 1100 }}
                    />
                    <Dialog.Content
                        className="radix-dialog-content"
                        style={{
                            maxWidth: isMobile ? '95vw' : '600px',
                            zIndex: 1101,
                        }}
                        aria-describedby={undefined}
                    >
                        <Dialog.Title className="radix-dialog-title">
                            {editingNorm ? "Редактировать норматив" : "Добавить норматив"}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="radix-dialog-close-btn" aria-label="Закрыть">
                                <CloseOutlined />
                            </button>
                        </Dialog.Close>
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{ periodType: 'months' }}
                            style={{ fontSize: isMobile ? '11px' : '14px' }}
                        >
                            <Form.Item
                                name="name"
                                label="Наименование СИЗ"
                                rules={[{ required: true, message: 'Введите наименование СИЗ' }]}
                                style={{ marginBottom: 12 }}
                            >
                                <Input
                                    placeholder="Введите наименование СИЗ"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="classification"
                                label="Классификация (маркировка)"
                                style={{ marginBottom: 12 }}
                            >
                                <Select
                                    placeholder="Выберите классификацию"
                                    allowClear
                                    style={{ width: '100%' }}
                                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                                >
                                    <Select.Option value="Тн">Тн (теплозащитные)</Select.Option>
                                    <Select.Option value="ЗМи">ЗМи (от механических воздействий)</Select.Option>
                                    <Select.Option value="Ми">Ми (механические воздействия)</Select.Option>
                                    <Select.Option value="В">В (влагозащитные)</Select.Option>
                                    <Select.Option value="Вн">Вн (влагонепроницаемые)</Select.Option>
                                    <Select.Option value="ЗП">ЗП (защитные от пыли)</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="periodType"
                                label="Тип срока носки"
                                rules={[{ required: true, message: 'Выберите тип срока носки' }]}
                                style={{ marginBottom: 12 }}
                            >
                                <Select
                                    style={{ width: '100%' }}
                                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                                >
                                    <Select.Option value="months">В месяцах</Select.Option>
                                    <Select.Option value="until_worn">До износа</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="period"
                                label="Срок носки"
                                rules={[{ required: true, message: 'Введите срок носки' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    placeholder="Введите срок носки (число)"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Form>
                        <div className="radix-dialog-footer">
                            <Button onClick={handleModalCancel}>Отмена</Button>
                            <Button type="primary" onClick={handleModalOk}>
                                {editingNorm ? "Сохранить" : "Добавить"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            
            <style>
                {`
                    /* Стили для центрирования выпадающих меню на мобильных */
                    @media (max-width: 768px) {
                        .ant-dropdown {
                            position: fixed !important;
                            left: 50% !important;
                            transform: translateX(-50%) !important;
                            z-index: 1050 !important;
                        }
                        
                        .ant-dropdown-menu {
                            min-width: 120px !important;
                            text-align: center !important;
                        }
                        
                        .ant-dropdown-menu-item {
                            text-align: center !important;
                            padding: 8px 16px !important;
                        }
                    }

                    /* Адаптивные стили для модального окна нормативов СИЗ */
                    @media (max-width: 768px) {
                        .ant-modal {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        .ant-modal-content {
                            border-radius: 8px !important;
                        }
                        
                        .ant-modal-header {
                            padding: 12px 16px !important;
                            border-bottom: 1px solid #f0f0f0 !important;
                        }
                        
                        .ant-modal-title {
                            font-size: 16px !important;
                            font-weight: 600 !important;
                        }
                        
                        .ant-modal-body {
                            padding: 12px !important;
                        }
                        
                        .ant-form-item-label > label {
                            font-size: 14px !important;
                            font-weight: 500 !important;
                        }
                        
                        .ant-input,
                        .ant-select-selector {
                            font-size: 14px !important;
                            height: 36px !important;
                        }
                        
                        .ant-select-dropdown {
                            font-size: 14px !important;
                        }
                        
                        .ant-modal-footer {
                            padding: 12px 16px !important;
                            border-top: 1px solid #f0f0f0 !important;
                        }
                        
                        .ant-btn {
                            height: 36px !important;
                            font-size: 14px !important;
                        }
                    }
                `}
            </style>
            
            <style>
                {`
                    /* Адаптивные стили для таблицы нормативов СИЗ */
                    @media (max-width: 768px) {
                        .ant-table {
                            font-size: 12px !important;
                            table-layout: auto !important;
                        }
                        
                        .ant-table-thead > tr > th {
                            padding: 8px 4px !important;
                            font-size: 11px !important;
                            font-weight: 600 !important;
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                        }
                        
                        .ant-table-tbody > tr > td {
                            padding: 8px 4px !important;
                            font-size: 11px !important;
                            word-wrap: break-word !important;
                            word-break: break-word !important;
                            white-space: normal !important;
                        }
                        
                        .ant-table-tbody > tr > td .ant-btn {
                            padding: 2px 6px !important;
                            font-size: 10px !important;
                            height: 24px !important;
                        }
                        
                        .ant-table-tbody > tr > td .ant-tag {
                            font-size: 10px !important;
                            padding: 1px 6px !important;
                            margin: 1px !important;
                        }
                        
                        .ant-table-container {
                            overflow-x: hidden !important;
                            width: 100% !important;
                        }
                        
                        .ant-table-content {
                            overflow-x: hidden !important;
                            width: 100% !important;
                        }
                        
                        .ant-table-wrapper {
                            overflow-x: hidden !important;
                            width: 100% !important;
                        }
                        
                        .ant-table-scroll {
                            overflow-x: hidden !important;
                        }
                        
                        /* Специальные стили для модального окна на мобильных */
                        .ant-modal-close {
                            z-index: 1002 !important;
                            background: #ff4d4f !important;
                            border-radius: 4px !important;
                            width: 32px !important;
                            height: 32px !important;
                            cursor: pointer !important;
                            border: none !important;
                            position: fixed !important;
                            top: 10px !important;
                            right: 10px !important;
                        }
                        
                        .ant-modal-close:hover {
                            background: #ff7875 !important;
                        }
                        
                        .ant-modal-close .anticon {
                            color: #fff !important;
                            font-size: 16px !important;
                        }
                        
                        /* Стили для кнопки закрытия в заголовке */
                        .ant-modal-header .ant-btn {
                            background: #ff4d4f !important;
                            border: none !important;
                            color: #fff !important;
                            font-weight: bold !important;
                        }
                        
                        .ant-modal-header .ant-btn:hover {
                            background: #ff7875 !important;
                        }
                        
                        .ant-modal-mask {
                            z-index: 1000 !important;
                        }
                        
                        .ant-modal-wrap {
                            z-index: 1000 !important;
                        }
                        
                        /* Полная адаптивность модального окна для мобильных */
                        .ant-modal {
                            margin: 0 !important;
                            padding: 0 !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            max-width: 100vw !important;
                            max-height: 100vh !important;
                            width: 100vw !important;
                            height: 100vh !important;
                        }
                        
                        .ant-modal-wrap {
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            width: 100vw !important;
                            height: 100vh !important;
                        }
                        
                        .ant-modal-content {
                            border-radius: 0 !important;
                            height: 100vh !important;
                            display: flex !important;
                            flex-direction: column !important;
                        }
                        
                        .ant-modal-header {
                            padding: 8px 12px !important;
                            border-bottom: 1px solid #f0f0f0 !important;
                            flex-shrink: 0 !important;
                        }
                        
                        .ant-modal-title {
                            font-size: 14px !important;
                            font-weight: 600 !important;
                            margin: 0 !important;
                        }
                        
                        .ant-modal-body {
                            padding: 4px 8px !important;
                            flex: 1 !important;
                            overflow-y: auto !important;
                        }
                        
                        .ant-form-item {
                            margin-bottom: 8px !important;
                        }
                        
                        .ant-form-item-label > label {
                            font-size: 11px !important;
                            height: auto !important;
                            line-height: 1.2 !important;
                            margin-bottom: 2px !important;
                        }
                        
                        .ant-input,
                        .ant-select-selector {
                            font-size: 11px !important;
                            height: 28px !important;
                            padding: 2px 6px !important;
                        }
                        
                        .ant-select-dropdown {
                            font-size: 11px !important;
                        }
                        
                        .ant-modal-footer {
                            padding: 6px 12px !important;
                            border-top: 1px solid #f0f0f0 !important;
                            flex-shrink: 0 !important;
                        }
                        
                        .ant-btn {
                            font-size: 11px !important;
                            height: 28px !important;
                            padding: 2px 8px !important;
                            margin: 0 2px !important;
                        }
                        
                        /* Дополнительные стили для принудительной адаптивности */
                        @media (max-width: 768px) {
                            .ant-modal {
                                position: fixed !important;
                                top: 0 !important;
                                left: 0 !important;
                                right: 0 !important;
                                bottom: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100vw !important;
                                height: 100vh !important;
                                max-width: 100vw !important;
                                max-height: 100vh !important;
                            }
                            
                            .ant-modal-wrap {
                                position: fixed !important;
                                top: 0 !important;
                                left: 0 !important;
                                right: 0 !important;
                                bottom: 0 !important;
                                width: 100vw !important;
                                height: 100vh !important;
                            }
                            
                            .ant-modal-content {
                                width: 100vw !important;
                                height: 100vh !important;
                                max-width: 100vw !important;
                                max-height: 100vh !important;
                                border-radius: 0 !important;
                            }
                        }
                    }
                `}
            </style>
        </>
    );
};

export default memo(SizNormsTable);
