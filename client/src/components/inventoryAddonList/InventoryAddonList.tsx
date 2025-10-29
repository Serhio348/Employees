import { Table, Tag, Button, Space, Tooltip, Dropdown, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined, MoreOutlined } from '@ant-design/icons';
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
            width: 80,
            align: 'center' as const,
            render: (_: any, record: InventoryAddon) => {
                const menuItems = [
                    {
                        key: 'edit',
                        label: 'Редактировать',
                        icon: <EditOutlined />,
                        onClick: () => onEdit(record),
                    },
                    {
                        key: 'delete',
                        label: 'Удалить',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => {
                            if (record.id) {
                                Modal.confirm({
                                    title: 'Удалить дополнение?',
                                    content: 'Вы уверены, что хотите удалить это дополнение?',
                                    okText: 'Да',
                                    cancelText: 'Нет',
                                    onOk: () => onDelete(record.id!),
                                    onCancel: () => {
                                        if (onCancelDelete) {
                                            onCancelDelete(record.id!);
                                        }
                                    },
                                });
                            }
                        },
                    },
                ];

                return (
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                            style={{ 
                                padding: '4px 8px',
                                fontSize: '12px',
                                minWidth: '32px'
                            }}
                        />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <>
            <style>
                {`
                    /* Стили для Dropdown меню действий */
                    .ant-dropdown-menu {
                        min-width: 140px !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                        border-radius: 6px !important;
                    }
                    
                    .ant-dropdown-menu-item {
                        padding: 8px 12px !important;
                        font-size: 13px !important;
                    }
                    
                    .ant-dropdown-menu-item .anticon {
                        margin-right: 8px !important;
                        font-size: 12px !important;
                    }
                    
                    .ant-dropdown-menu-item-danger {
                        color: #ff4d4f !important;
                    }
                    
                    .ant-dropdown-menu-item-danger:hover {
                        background-color: #fff2f0 !important;
                    }
                `}
            </style>
            
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
        </>
    );
};

export default InventoryAddonList;
