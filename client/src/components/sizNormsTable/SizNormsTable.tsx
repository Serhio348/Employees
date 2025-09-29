import React, { memo, useState } from 'react';
import { Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { useSizNorms, SizNorm } from '../../hooks/useSizNorms';

const SizNormsTable = () => {
    const { sizNorms, updateSizNorms } = useSizNorms();
    const [norms, setNorms] = useState<SizNorm[]>(sizNorms);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingNorm, setEditingNorm] = useState<SizNorm | null>(null);
    const [form] = Form.useForm();

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

    const handleDelete = (id: string) => {
        const updatedNorms = norms.filter(norm => norm.id !== id);
        setNorms(updatedNorms);
        updateSizNorms(updatedNorms);
    };

    const handleModalOk = () => {
        form.validateFields().then(values => {
            let updatedNorms: SizNorm[];
            if (editingNorm) {
                // Редактирование
                updatedNorms = norms.map(norm => 
                    norm.id === editingNorm.id ? { ...norm, ...values } : norm
                );
            } else {
                // Добавление
                const newNorm: SizNorm = {
                    id: Date.now().toString(),
                    ...values
                };
                updatedNorms = [...norms, newNorm];
            }
            setNorms(updatedNorms);
            updateSizNorms(updatedNorms);
            setIsModalVisible(false);
            form.resetFields();
        });
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
            width: 200,
        },
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
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center' as const,
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
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: SizNorm) => (
                <Space>
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
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    Нормы выдачи СИЗ
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    Добавить норматив
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={norms}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
            />
            
            <Modal
                title={editingNorm ? "Редактировать норматив" : "Добавить норматив"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ periodType: 'months' }}
                >
                    <Form.Item
                        name="name"
                        label="Наименование СИЗ"
                        rules={[{ required: true, message: 'Введите наименование СИЗ' }]}
                    >
                        <Input placeholder="Введите наименование СИЗ" />
                    </Form.Item>
                    
                    <Form.Item
                        name="classification"
                        label="Классификация (маркировка)"
                    >
                        <Select placeholder="Выберите классификацию" allowClear>
                            <Select.Option value="Тн">Тн (теплозащитные)</Select.Option>
                            <Select.Option value="ЗМи">ЗМи (защитные от механических воздействий)</Select.Option>
                            <Select.Option value="Ми">Ми (механические воздействия)</Select.Option>
                            <Select.Option value="В">В (влагозащитные)</Select.Option>
                            <Select.Option value="Вн">Вн (влагонепроницаемые)</Select.Option>
                            <Select.Option value="ЗП">ЗП (защитные от пыли)</Select.Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="quantity"
                        label="Количество"
                        rules={[{ required: true, message: 'Введите количество' }]}
                    >
                        <InputNumber
                            min={1}
                            max={100}
                            style={{ width: '100%' }}
                            placeholder="Введите количество"
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="periodType"
                        label="Тип срока носки"
                        rules={[{ required: true, message: 'Выберите тип срока носки' }]}
                    >
                        <Select>
                            <Select.Option value="months">В месяцах</Select.Option>
                            <Select.Option value="until_worn">До износа</Select.Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="period"
                        label="Срок носки"
                        rules={[{ required: true, message: 'Введите срок носки' }]}
                    >
                        <Input placeholder="Введите срок носки" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default memo(SizNormsTable);
