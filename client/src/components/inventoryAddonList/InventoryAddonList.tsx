import { Table, Tag, Button, Space, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { InventoryAddon } from '../../app/services/inventoryAddon';
import dayjs from 'dayjs';

interface Props {
    addons: InventoryAddon[];
    onEdit: (addon: InventoryAddon) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
    onCancelDelete?: (id: string) => void;
}

const InventoryAddonList = ({ addons, onEdit, onDelete, loading, onCancelDelete }: Props) => {
    const isExpiring = (date: string) => {
        const replacementDate = dayjs(date);
        const now = dayjs();
        const daysUntilReplacement = replacementDate.diff(now, 'day');
        return daysUntilReplacement <= 30 && daysUntilReplacement >= 0;
    };

    const isOverdue = (date: string) => {
        const replacementDate = dayjs(date);
        const now = dayjs();
        return replacementDate.isBefore(now);
    };

    const getStatusColor = (date: string) => {
        if (isOverdue(date)) return 'red';
        if (isExpiring(date)) return 'orange';
        return 'green';
    };

    const getStatusText = (date: string) => {
        if (isOverdue(date)) return 'Просрочено';
        if (isExpiring(date)) return 'Требует замены';
        return 'В норме';
    };

    const columns = [
        {
            title: 'Наименование',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Дата выдачи',
            dataIndex: 'issueDate',
            key: 'issueDate',
            render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
        },
        {
            title: 'Срок носки',
            dataIndex: 'wearPeriodMonths',
            key: 'wearPeriodMonths',
            render: (months: number) => `${months} мес.`,
        },
        {
            title: 'Дата замены',
            dataIndex: 'nextReplacementDate',
            key: 'nextReplacementDate',
            render: (date: string) => (
                <Space>
                    {dayjs(date).format('DD.MM.YYYY')}
                    {isExpiring(date) && (
                        <Tooltip title="Требует замены в ближайшее время">
                            <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'Статус',
            dataIndex: 'nextReplacementDate',
            key: 'status',
            render: (date: string) => {
                const color = getStatusColor(date);
                const text = getStatusText(date);
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: InventoryAddon) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить дополнение?"
                        description="Вы уверены, что хотите удалить это дополнение?"
                        onConfirm={() => record.id && onDelete(record.id)}
                        onCancel={() => {
                            if (record.id && onCancelDelete) {
                                onCancelDelete(record.id);
                            }
                        }}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={addons}
            rowKey="id"
            loading={loading}
            onRow={() => ({
                style: { cursor: 'default' }
            })}
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} дополнений`,
            }}
        />
    );
};

export default InventoryAddonList;
