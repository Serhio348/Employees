import { Table, Tag, Button, Space, Popconfirm, Progress, Checkbox, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import React, { memo, useState, useEffect } from 'react';
import { InventoryItem } from '../../app/services/inventory';
import { useSizNorms } from '../../hooks/useSizNorms';
import dayjs from 'dayjs';

interface Props {
    inventory: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
    onViewAddons?: (item: InventoryItem) => void;
    loading?: boolean;
    deletingIds?: string[];
    onCancelDelete?: (id: string) => void;
    onWriteOff?: (ids: string[]) => void;
    showWriteOffButton?: boolean;
}

const InventoryList = ({ inventory, onEdit, onDelete, onViewAddons, loading, deletingIds = [], onCancelDelete, onWriteOff, showWriteOffButton = true }: Props) => {
    const { sizNorms } = useSizNorms();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isWriteOffModalVisible, setIsWriteOffModalVisible] = useState(false);

    // Подавляем ошибку ResizeObserver
    useEffect(() => {
        const handleError = (e: ErrorEvent) => {
            if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
                e.stopImmediatePropagation();
            }
        };
        
        window.addEventListener('error', handleError);
        
        return () => {
            window.removeEventListener('error', handleError);
        };
    }, []);

    // Нормализация названий для гибкого сопоставления (игнор регистра/ё/пунктуации/двойных пробелов)
    const normalizeName = (value: string = '') => {
        return value
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[^a-zа-я0-9\s]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Попытка найти подходящий норматив по названию предмета (учитываем возможные расхождения)
    const findNormByItemName = (itemName: string) => {
        const normItem = normalizeName(itemName);

        // 1) Точное совпадение (нормализованное)
        let norm = sizNorms.find(n => normalizeName(n.name) === normItem);
        if (norm) return norm;

        // 2) Частичное совпадение (включение) в обе стороны
        norm = sizNorms.find(n => {
            const nn = normalizeName(n.name);
            return nn.includes(normItem) || normItem.includes(nn);
        });
        if (norm) return norm;

        return undefined;
    };

    // Функция для расчета процента износа
    const calculateWearPercentage = (item: InventoryItem) => {
        if (!item.issueDate) return 0;

        const issueDate = dayjs(item.issueDate).startOf('day');
        const currentDate = dayjs().startOf('day');

        // Находим норматив для данного предмета (с учетом возможных расхождений в названии)
        const norm = findNormByItemName(item.itemName);
        if (!norm) return 0;

        let totalDays = 0;
        let endDate = issueDate;
        if (norm.periodType === 'months') {
            // Точный расчет с использованием dayjs для добавления месяцев
            const months = parseInt(norm.period);
            endDate = issueDate.add(months, 'month');
            totalDays = endDate.diff(issueDate, 'day');
        } else if (norm.periodType === 'until_worn') {
            // Для предметов "до износа" считаем 365 дней (1 год)
            totalDays = 365;
            endDate = issueDate.add(365, 'day');
        }

        if (totalDays === 0) return 0;

        // Считаем через оставшиеся дни, чтобы точно не получать 100% раньше срока
        const daysLeft = endDate.diff(currentDate, 'day');
        const elapsed = totalDays - Math.max(daysLeft, 0);
        const raw = (elapsed / totalDays) * 100;
        const percent = daysLeft > 0 ? Math.min(raw, 99) : 100;
        return Math.floor(percent);
    };

    // Функция для получения цвета прогресс-бара
    const getProgressColor = (percentage: number) => {
        if (percentage < 30) return '#52c41a'; // Зеленый
        if (percentage < 60) return '#faad14'; // Желтый
        if (percentage < 90) return '#fa8c16'; // Оранжевый
        return '#f5222d'; // Красный
    };

    // Функция для проверки истечения срока
    const isExpired = (item: InventoryItem) => {
        if (!item.issueDate) return false;
        
        const issueDate = dayjs(item.issueDate).startOf('day');
        const currentDate = dayjs().startOf('day');
        
        const norm = findNormByItemName(item.itemName);
        if (!norm) return false;
        
        let endDate = issueDate;
        if (norm.periodType === 'months') {
            const months = parseInt(norm.period);
            endDate = issueDate.add(months, 'month');
        } else if (norm.periodType === 'until_worn') {
            endDate = issueDate.add(365, 'day');
        }
        
        return !currentDate.isBefore(endDate.startOf('day'));
    };

    // Функции для массового списания
    const handleSelectItem = (itemId: string, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, itemId]);
        } else {
            setSelectedItems(prev => prev.filter(id => id !== itemId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const expiredItems = inventory.filter(item => isExpired(item)).map(item => item.id!);
            setSelectedItems(expiredItems);
        } else {
            setSelectedItems([]);
        }
    };

    const handleWriteOff = () => {
        if (selectedItems.length === 0) {
            message.warning('Выберите предметы для списания');
            return;
        }
        
        if (onWriteOff) {
            onWriteOff(selectedItems);
            setSelectedItems([]);
            setIsWriteOffModalVisible(false);
            message.success(`Списано ${selectedItems.length} предметов`);
        }
    };

    const openWriteOffModal = () => {
        const expiredItems = inventory.filter(item => isExpired(item));
        if (expiredItems.length === 0) {
            message.info('Нет просроченных предметов для списания');
            return;
        }
        setIsWriteOffModalVisible(true);
    };

    const columns = [
        ...(showWriteOffButton ? [{
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Checkbox
                        checked={selectedItems.length > 0 && selectedItems.length === inventory.filter(item => isExpired(item)).length}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < inventory.filter(item => isExpired(item)).length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span>Выбрать</span>
                </div>
            ),
            key: 'select',
            width: 80,
            render: (_: any, record: InventoryItem) => {
                const expired = isExpired(record);
                return (
                    <Checkbox
                        checked={selectedItems.includes(record.id!)}
                        onChange={(e) => handleSelectItem(record.id!, e.target.checked)}
                        disabled={!expired}
                        style={{ opacity: expired ? 1 : 0.3 }}
                    />
                );
            },
        }] : []),
        {
            title: 'Название',
            dataIndex: 'itemName',
            key: 'itemName',
        },
        {
            title: 'Тип',
            dataIndex: 'itemType',
            key: 'itemType',
            render: (type: string) => {
                const color = type === 'спецодежда' ? 'blue' : 
                             type === 'инструмент' ? 'green' : 
                             type === 'оборудование' ? 'orange' : 
                             type === 'сиз' ? 'purple' : 'default';
                return <Tag color={color}>{type}</Tag>;
            },
        },
        {
            title: 'Дата выдачи',
            dataIndex: 'issueDate',
            key: 'issueDate',
            render: (date: string) => {
                if (!date) return '-';
                return new Date(date).toLocaleDateString('ru-RU');
            }
        },
        {
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Процент износа',
            key: 'wearPercentage',
            width: 150,
            render: (_: any, record: InventoryItem) => {
                const percentage = calculateWearPercentage(record);
                const color = getProgressColor(percentage);
                
                // Дополнительная информация об оставшихся днях
                const getRemainingDays = (item: InventoryItem) => {
                    if (!item.issueDate) return 0;
                    
                    const issueDate = dayjs(item.issueDate);
                    const currentDate = dayjs();
                    const daysPassed = currentDate.diff(issueDate, 'day');
                    
        const norm = findNormByItemName(item.itemName);
                    if (!norm) return 0;
                    
                    let totalDays = 0;
                    if (norm.periodType === 'months') {
                        // Точный расчет с использованием dayjs для добавления месяцев
                        const months = parseInt(norm.period);
                        const endDate = issueDate.add(months, 'month');
                        totalDays = endDate.diff(issueDate, 'day');
                    } else if (norm.periodType === 'until_worn') {
                        totalDays = 365;
                    }
                    
                    return Math.max(0, Math.round(totalDays - daysPassed));
                };
                
                const remainingDays = getRemainingDays(record);
                
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Progress
                                percent={percentage}
                                size="small"
                                strokeColor={color}
                                showInfo={false}
                                style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: '12px', color: color, fontWeight: 'bold' }}>
                                {percentage}%
                            </span>
                        </div>
                        <div style={{ 
                            fontSize: '10px', 
                            color: remainingDays <= 0 ? '#ff4d4f' : '#666', 
                            textAlign: 'center',
                            fontWeight: remainingDays <= 0 ? 'bold' : 'normal'
                        }}>
                            {remainingDays > 0 ? `Осталось: ${remainingDays} дн.` : 'Срок истек'}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: InventoryItem) => {
                const expired = isExpired(record);
                const displayStatus = expired ? 'необходимо заменить' : status;
                
                let color = 'default';
                if (expired) {
                    color = 'red';
                } else if (status === 'выдан') {
                    color = 'green';
                } else if (status === 'возвращен') {
                    color = 'blue';
                } else if (status === 'списан') {
                    color = 'red';
                }
                
                return (
                    <Tag 
                        color={color}
                        style={expired ? {
                            animation: 'pulse 1.5s ease-in-out infinite',
                            fontWeight: 'bold',
                            border: '2px solid #ff4d4f'
                        } : {}}
                        icon={expired ? <ExclamationCircleOutlined /> : undefined}
                    >
                        {displayStatus}
                    </Tag>
                );
            },
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: InventoryItem) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                    >
                        Редактировать
                    </Button>
                    {onViewAddons && (
                        <Button
                            type="default"
                            icon={<PlusOutlined />}
                            onClick={() => onViewAddons(record)}
                        >
                            Дополнения
                        </Button>
                    )}
                    <Popconfirm
                        title="Удалить предмет?"
                        description="Вы уверены, что хотите удалить этот предмет из инвентаря?"
                        onConfirm={() => record.id && onDelete(record.id)}
                        onCancel={() => {
                            if (record.id && onCancelDelete) {
                                onCancelDelete(record.id);
                            }
                        }}
                        okText="Да"
                        cancelText="Нет"
                        disabled={deletingIds.includes(record.id || '')}
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletingIds.includes(record.id || '')}
                            disabled={deletingIds.includes(record.id || '')}
                        >
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const expiredItems = inventory.filter(item => isExpired(item));

    return (
        <>
            <style>
                {`
                    @keyframes pulse {
                        0% {
                            transform: scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: scale(1.05);
                            opacity: 0.8;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }

                    @keyframes blink {
                        0%, 50% {
                            opacity: 1;
                        }
                        51%, 100% {
                            opacity: 0.3;
                        }
                    }

                    /* Добавляем курсор-указатель для всех интерактивных элементов */
                    .ant-btn {
                        cursor: pointer !important;
                    }

                    .ant-btn:hover {
                        cursor: pointer !important;
                    }

                    .ant-btn:focus {
                        cursor: pointer !important;
                    }

                    .ant-btn:active {
                        cursor: pointer !important;
                    }

                    /* Курсор-указатель для всех интерактивных элементов в таблице */
                    .ant-table-tbody .ant-btn,
                    .ant-table-tbody .ant-checkbox,
                    .ant-table-tbody .ant-checkbox-wrapper {
                        cursor: pointer !important;
                    }

                    .ant-table-tbody .ant-btn:hover,
                    .ant-table-tbody .ant-checkbox:hover,
                    .ant-table-tbody .ant-checkbox-wrapper:hover {
                        cursor: pointer !important;
                    }

                    /* Обычный курсор для строк таблицы */
                    .ant-table-tbody > tr {
                        cursor: default !important;
                    }

                    .ant-table-tbody > tr:hover {
                        cursor: default !important;
                    }

                    .ant-table-tbody > tr > td {
                        cursor: default !important;
                    }

                    .ant-table-tbody > tr:hover > td {
                        cursor: default !important;
                    }

                `}
            </style>
            
            {expiredItems.length > 0 && showWriteOffButton && (
                <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#fff2f0', border: '1px solid #ff4d4f', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                            <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
                                Найдено {expiredItems.length} просроченных предметов
                            </span>
                        </div>
                        <Button
                            type="primary"
                            danger
                            icon={<FileTextOutlined />}
                            onClick={openWriteOffModal}
                        >
                            Списать просроченные
                        </Button>
                    </div>
                </div>
            )}

            <Table
                columns={columns}
                dataSource={inventory}
                rowKey="id"
                loading={loading}
                onRow={(record) => ({
                    style: { 
                        cursor: 'default'
                    }
                })}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} предметов`,
                }}
            />

            {showWriteOffButton && (
                <Modal
                    title="Списание просроченных предметов"
                    open={isWriteOffModalVisible}
                    onOk={handleWriteOff}
                    onCancel={() => {
                        setIsWriteOffModalVisible(false);
                        setSelectedItems([]);
                    }}
                    okText="Списать"
                    cancelText="Отмена"
                    okButtonProps={{ danger: true }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <p>Выберите предметы для списания:</p>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
                            {expiredItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                    <Checkbox
                                        checked={selectedItems.includes(item.id!)}
                                        onChange={(e) => handleSelectItem(item.id!, e.target.checked)}
                                    />
                                    <span style={{ flex: 1 }}>{item.itemName}</span>
                                    <Tag color="red">Просрочен</Tag>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                        Будет списано: {selectedItems.length} из {expiredItems.length} предметов
                    </div>
                </Modal>
            )}
        </>
    );
};

export default memo(InventoryList);
