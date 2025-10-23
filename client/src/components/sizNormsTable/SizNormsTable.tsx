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
            setIsMobile(window.innerWidth <= 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        setIsModalVisible(false);
        form.resetFields();
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
                width: '100%'
            }}>
                <Table
                    columns={columns}
                    dataSource={sizNorms}
                    rowKey="id"
                    pagination={false}
                    size={isMobile ? "small" : "middle"}
                    scroll={isMobile ? { y: 300 } : { x: 800, y: 400 }}
                    loading={isLoading}
                    style={{
                        minWidth: isMobile ? '100%' : '800px',
                        width: '100%'
                    }}
                />
            </div>
            
            <Modal
                title={editingNorm ? "Редактировать норматив" : "Добавить норматив"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={isMobile ? '98%' : 600}
                centered
                maskClosable={true}
                closable={true}
                destroyOnClose={true}
                keyboard={true}
                style={{ 
                    top: isMobile ? 5 : 100,
                    maxWidth: isMobile ? '100vw' : '600px'
                }}
                bodyStyle={{ 
                    padding: isMobile ? '12px' : '24px',
                    maxHeight: isMobile ? '85vh' : '80vh',
                    overflowY: 'auto'
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
                    }
                `}
            </style>
        </>
    );
};

export default memo(SizNormsTable);
