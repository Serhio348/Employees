import React, { memo, useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, message, Row, Col, Dropdown, Menu } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';
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
            const wasMobile = isMobile;
            const nowMobile = window.innerWidth <= 768;
            setIsMobile(nowMobile);
            
            // Если изменился режим мобильного/десктопного, закрываем модальное окно
            if (wasMobile !== nowMobile && isModalVisible) {
                setIsModalVisible(false);
                form.resetFields();
                setEditingNorm(null);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isModalVisible, form]);

    // Защита от случайного открытия модального окна при изменении разрешения
    useEffect(() => {
        if (!isModalVisible) {
            // Убеждаемся, что модальное окно закрыто при изменении разрешения
            setIsModalVisible(false);
        }
    }, [isMobile]);

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
        console.log('Modal cancel clicked');
        setIsModalVisible(false);
        form.resetFields();
        setEditingNorm(null);
    };

    // Дополнительная обработка закрытия модального окна
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalVisible) {
                handleModalCancel();
            }
        };

        const handleMaskClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('ant-modal-mask') && isModalVisible) {
                handleModalCancel();
            }
        };

        if (isModalVisible) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('click', handleMaskClick);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('click', handleMaskClick);
        };
    }, [isModalVisible]);

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
            
            <Modal
                title={editingNorm ? "Редактировать норматив" : "Добавить норматив"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={isMobile ? '100%' : 600}
                centered={!isMobile}
                maskClosable={true}
                closable={true}
                destroyOnClose={false}
                keyboard={true}
                style={{ 
                    top: isMobile ? 0 : 100,
                    left: isMobile ? 0 : undefined,
                    right: isMobile ? 0 : undefined,
                    bottom: isMobile ? 0 : undefined,
                    margin: isMobile ? 0 : undefined,
                    maxWidth: isMobile ? '100vw' : '600px',
                    maxHeight: isMobile ? '100vh' : '80vh'
                }}
                bodyStyle={{ 
                    padding: isMobile ? '4px' : '24px',
                    maxHeight: isMobile ? 'calc(100vh - 120px)' : '60vh',
                    overflowY: 'auto',
                    fontSize: isMobile ? '11px' : '14px'
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ periodType: 'months' }}
                >
                    <Row gutter={isMobile ? [0, 12] : [16, 16]}>
                        <Col span={24}>
                            <Form.Item
                                name="name"
                                label="Наименование СИЗ"
                                rules={[{ required: true, message: 'Введите наименование СИЗ' }]}
                            >
                                <Input 
                                    placeholder="Введите наименование СИЗ"
                                    size={isMobile ? "small" : "middle"}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        
                        <Col span={24}>
                            <Form.Item
                                name="classification"
                                label={isMobile ? "Классификация" : "Классификация (маркировка)"}
                            >
                                <Select 
                                    placeholder="Выберите классификацию" 
                                    allowClear
                                    size={isMobile ? "small" : "middle"}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="Тн">Тн (теплозащитные)</Select.Option>
                                    <Select.Option value="ЗМи">ЗМи (защитные от механических воздействий)</Select.Option>
                                    <Select.Option value="Ми">Ми (механические воздействия)</Select.Option>
                                    <Select.Option value="В">В (влагозащитные)</Select.Option>
                                    <Select.Option value="Вн">Вн (влагонепроницаемые)</Select.Option>
                                    <Select.Option value="ЗП">ЗП (защитные от пыли)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        
                        <Col span={24}>
                            <Form.Item
                                name="periodType"
                                label="Тип срока носки"
                                rules={[{ required: true, message: 'Выберите тип срока носки' }]}
                            >
                                <Select 
                                    size={isMobile ? "small" : "middle"}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="months">В месяцах</Select.Option>
                                    <Select.Option value="until_worn">До износа</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        
                        <Col span={24}>
                            <Form.Item
                                name="period"
                                label="Срок носки"
                                rules={[{ required: true, message: 'Введите срок носки' }]}
                            >
                                <Input 
                                    placeholder="Введите срок носки"
                                    size={isMobile ? "small" : "middle"}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            
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
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        
                        .ant-modal-wrap {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
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
                        }
                        
                        .ant-modal-close:hover {
                            background: #ff7875 !important;
                        }
                        
                        .ant-modal-close .anticon {
                            color: #fff !important;
                            font-size: 16px !important;
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
