import React, { memo, useState } from 'react';
import { Table, Tag, Button, Form, Input, Select, message, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';
import './SizNormsTable.css';
import { ColumnsType } from 'antd/es/table';
import { useSizNorms, SizNorm } from '../../hooks/useSizNorms';

const SizNormsTable = () => {
    const { sizNorms, isLoading, addNorm, updateNorm, deleteNorm, initDefaults } = useSizNorms();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingNorm, setEditingNorm] = useState<SizNorm | null>(null);
    const [form] = Form.useForm();
    const { isMobile } = useResponsive();

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
                    return (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
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
            
            {isModalVisible && (
                <Card
                    title={editingNorm ? 'Редактировать норматив' : 'Добавить норматив'}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={
                        <Button type="text" size="small" onClick={handleModalCancel}>
                            Закрыть
                        </Button>
                    }
                >
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
                            <Input placeholder="Введите наименование СИЗ" style={{ width: '100%' }} />
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
                            style={{ marginBottom: 12 }}
                        >
                            <Input placeholder="Введите срок носки (число)" style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button onClick={handleModalCancel}>Отмена</Button>
                        <Button type="primary" onClick={handleModalOk}>
                            {editingNorm ? 'Сохранить' : 'Добавить'}
                        </Button>
                    </div>
                </Card>
            )}
            
        </>
    );
};

export default memo(SizNormsTable);
