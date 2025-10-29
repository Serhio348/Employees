import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, Checkbox, Progress, Tag, message, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined, FileTextOutlined, MoreOutlined } from '@ant-design/icons';
import { InventoryItem } from '../../app/services/inventory';
import { useSizNorms } from '../../hooks/useSizNorms';
import dayjs from 'dayjs';

interface Props {
    inventory: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
    onViewAddons?: (item: InventoryItem) => void;
    loading?: boolean;
    onCancelDelete?: (id: string) => void;
    onWriteOff?: (ids: string[]) => void;
    showWriteOffButton?: boolean;
}

const InventoryList = ({ inventory, onEdit, onDelete, onViewAddons, loading, onCancelDelete, onWriteOff, showWriteOffButton = true }: Props) => {
    const { sizNorms } = useSizNorms();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isWriteOffModalVisible, setIsWriteOffModalVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isVerySmall, setIsVerySmall] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Агрессивная очистка скрытых элементов AntD для предотвращения aria-hidden ошибок
    const ensureSafeFocus = useCallback(() => {
        try {
            // Сначала убираем фокус с активного элемента
            const activeElement = document.activeElement as HTMLElement | null;
            if (activeElement && typeof activeElement.blur === 'function') {
                activeElement.blur();
            }
            
            // Удаляем все скрытые элементы AntD с aria-hidden
            const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
            hiddenElements.forEach(el => {
                // Проверяем, что это скрытый элемент AntD (обычно с tabindex="0")
                if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') === '0') {
                    el.remove();
                }
            });
            
            // Дополнительно очищаем все элементы с нулевыми размерами и aria-hidden
            const zeroSizeElements = document.querySelectorAll('[style*="width: 0px"][style*="height: 0px"][aria-hidden="true"]');
            zeroSizeElements.forEach(el => el.remove());
            
            // Перенаправляем фокус на body
            const body = document.body as HTMLElement;
            body.focus?.({ preventScroll: true });
        } catch (error) {
            console.warn('Error in ensureSafeFocus:', error);
        }
    }, []);

    // Подавляем ошибку ResizeObserver и отслеживаем размер экрана
    useEffect(() => {
        const handleError = (e: ErrorEvent) => {
            if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
                e.stopImmediatePropagation();
            }
        };
        
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            setIsVerySmall(window.innerWidth < 420);
        };
        
        window.addEventListener('error', handleError);
        window.addEventListener('resize', handleResize);
        handleResize(); // Вызываем сразу для установки начального состояния
        
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Очищаем скрытые элементы AntD при каждом обновлении компонента
    useEffect(() => {
        const cleanup = () => {
            ensureSafeFocus();
        };
        
        // Очищаем сразу
        cleanup();
        
        // И через небольшую задержку для надежности
        const timeoutId = setTimeout(cleanup, 100);
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [forceUpdate, ensureSafeFocus]);

    // Нормализация названий для гибкого сопоставления (игнор регистра/ё/пунктуации/двойных пробелов)
    const normalizeName = useCallback((value: string = '') => {
        return value
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/[^a-zа-я0-9\s]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }, []);

    // Попытка найти подходящий норматив по названию предмета (учитываем возможные расхождения)
    const findNormByItemName = useCallback((itemName: string) => {
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
    }, [sizNorms, normalizeName]);

    // Функция для расчета процента износа
    const calculateWearPercentage = useCallback((item: InventoryItem) => {
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
    }, [findNormByItemName]);

    // Функция для получения цвета прогресс-бара
    const getProgressColor = useCallback((percentage: number) => {
        if (percentage < 30) return '#52c41a'; // Зеленый
        if (percentage < 60) return '#faad14'; // Желтый
        if (percentage < 90) return '#fa8c16'; // Оранжевый
        return '#f5222d'; // Красный
    }, []);

    // Функция для проверки истечения срока
    const isExpired = useCallback((item: InventoryItem) => {
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
    }, [findNormByItemName]);

    // Функции для массового списания
    const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, itemId]);
        } else {
            setSelectedItems(prev => prev.filter(id => id !== itemId));
        }
    }, []);

    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            const expiredItems = inventory.filter(item => isExpired(item)).map(item => item.id!);
            setSelectedItems(expiredItems);
        } else {
            setSelectedItems([]);
        }
    }, [inventory, isExpired]);

    const handleWriteOff = useCallback(() => {
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
    }, [selectedItems, onWriteOff]);

    const openWriteOffModal = useCallback(() => {
        const expiredItems = inventory.filter(item => isExpired(item));
        if (expiredItems.length === 0) {
            message.info('Нет просроченных предметов для списания');
            return;
        }
        setIsWriteOffModalVisible(true);
    }, [inventory, isExpired]);


    const columns = useMemo(() => [
        ...(showWriteOffButton ? [{
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Checkbox
                        checked={selectedItems.length > 0 && selectedItems.length === inventory.filter(item => isExpired(item)).length}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < inventory.filter(item => isExpired(item)).length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span style={{ display: isMobile ? 'none' : 'inline' }}>Выбрать</span>
                </div>
            ),
            key: 'select',
            width: isMobile ? 50 : 80,
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
            width: isVerySmall ? '100%' : isMobile ? '70%' : undefined,
            ellipsis: true,
            render: (text: string, record: InventoryItem) => (
                <div style={{ 
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    width: '100%'
                }}>
                    <span style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0
                    }}>
                        {text}
                    </span>
                    {isExpired(record) && (
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '12px', flexShrink: 0 }} />
                    )}
                </div>
            ),
        },
        ...(isMobile ? [] : [{
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
            render: (quantity: number) => (
                <div style={{ 
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#1890ff'
                }}>
                    {quantity}
                </div>
            ),
        }]),
        ...(isMobile ? [] : [
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
            width: 80,
            align: 'center' as const,
            render: (_: any, record: InventoryItem) => {
                const menuItems = [
                    {
                        key: 'edit',
                        label: 'Редактировать',
                        icon: <EditOutlined />,
                        onClick: () => {
                            ensureSafeFocus();
                            onEdit(record);
                            setForceUpdate(prev => prev + 1);
                        },
                    },
                    // Кнопка "Дополнения" удалена как неиспользуемая
                    {
                        key: 'delete',
                        label: 'Удалить',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => {
                            if (record.id) {
                                Modal.confirm({
                                    title: 'Удалить предмет?',
                                    content: 'Вы уверены, что хотите удалить этот предмет из инвентаря?',
                                    okText: 'Да',
                                    cancelText: 'Нет',
                                    maskClosable: true,
                                    keyboard: true,
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
                        destroyPopupOnHide
                        onOpenChange={(open) => {
                            // Перенаправляем фокус, чтобы не оставался внутри aria-hidden контейнеров
                            ensureSafeFocus();
                            if (!open) {
                                setTimeout(() => setForceUpdate(prev => prev + 1), 50);
                            }
                        }}
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
        ]),
        ...(isMobile ? [{
            title: isVerySmall ? '' : 'Подробнее',
            key: 'details',
            width: isVerySmall ? '60px' : '30%',
            align: 'center' as const,
            render: (_: any, record: InventoryItem) => {
                const percentage = calculateWearPercentage(record);
                const color = getProgressColor(percentage);
                const expired = isExpired(record);
                
                return (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'quantity',
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Количество:</span>
                                            <span style={{ 
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: '#1890ff'
                                            }}>
                                                {record.quantity}
                                            </span>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'type',
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Тип:</span>
                                            <Tag color={
                                                record.itemType === 'спецодежда' ? 'blue' : 
                                                record.itemType === 'инструмент' ? 'green' : 
                                                record.itemType === 'оборудование' ? 'orange' : 
                                                record.itemType === 'сиз' ? 'purple' : 'default'
                                            }>
                                                {record.itemType}
                                            </Tag>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'date',
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Дата выдачи:</span>
                                            <span>{record.issueDate ? new Date(record.issueDate).toLocaleDateString('ru-RU') : '-'}</span>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'status',
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Статус:</span>
                                            <Tag color={
                                                expired ? 'red' :
                                                record.status === 'выдан' ? 'green' :
                                                record.status === 'возвращен' ? 'blue' :
                                                record.status === 'списан' ? 'red' : 'default'
                                            }>
                                                {expired ? 'необходимо заменить' : record.status}
                                            </Tag>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'wear',
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Износ:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Progress
                                                    percent={percentage}
                                                    size="small"
                                                    strokeColor={color}
                                                    showInfo={false}
                                                    style={{ width: '60px', height: '6px' }}
                                                />
                                                <span style={{ color, fontWeight: 'bold' }}>
                                                    {percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'actions',
                                    label: 'Действия',
                                    children: [
                                        {
                                            key: 'edit',
                                            label: 'Редактировать',
                                            icon: <EditOutlined />,
                                            onClick: () => {
                                                onEdit(record);
                                                // Принудительно обновляем компонент для устранения блокировки кнопок
                                                setForceUpdate(prev => prev + 1);
                                            },
                                        },
                                        // Кнопка "Дополнения" удалена как неиспользуемая
                                        {
                                            key: 'delete',
                                            label: 'Удалить',
                                            icon: <DeleteOutlined />,
                                            danger: true,
                                            onClick: () => {
                                                if (record.id) {
                                                    onDelete(record.id);
                                                }
                                            },
                                        },
                                    ],
                                },
                            ],
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                        onOpenChange={(open) => {
                            ensureSafeFocus();
                            if (!open) {
                                setTimeout(() => setForceUpdate(prev => prev + 1), 50);
                            }
                        }}
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                            style={{ 
                                padding: isVerySmall ? '1px 2px' : '2px 4px',
                                fontSize: isVerySmall ? '10px' : '12px',
                                minWidth: isVerySmall ? '24px' : 'auto'
                            }}
                        >
                            {isVerySmall ? '' : 'Подробнее'}
                        </Button>
                    </Dropdown>
                );
            },
        }] : []),
    ], [showWriteOffButton, selectedItems, inventory, isExpired, isMobile, isVerySmall, onEdit, onDelete, handleSelectAll, handleSelectItem, calculateWearPercentage, getProgressColor, findNormByItemName, onCancelDelete, ensureSafeFocus]);

    const expiredItems = useMemo(() => inventory.filter(item => isExpired(item)), [inventory, isExpired]);

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

                    /* Адаптивные стили для мобильных устройств */
                    @media (max-width: 768px) {
                        .ant-table-thead > tr > th {
                            padding: 6px 2px !important;
                            font-size: 11px !important;
                        }
                        
                        .ant-table-tbody > tr > td {
                            padding: 6px 2px !important;
                            font-size: 11px !important;
                        }
                        
                        .ant-btn-sm {
                            padding: 2px 4px !important;
                            font-size: 10px !important;
                            height: 24px !important;
                        }
                        
                        .ant-tag {
                            font-size: 10px !important;
                            padding: 1px 4px !important;
                        }
                        
                        .ant-pagination {
                            font-size: 11px !important;
                        }
                        
                        .ant-pagination-item,
                        .ant-pagination-prev,
                        .ant-pagination-next {
                            min-width: 24px !important;
                            height: 24px !important;
                            line-height: 22px !important;
                        }
                        
                        /* Адаптивная ширина колонки названия */
                        .ant-table-tbody > tr > td:first-child,
                        .ant-table-thead > tr > th:first-child {
                            max-width: 0 !important;
                            width: auto !important;
                        }
                        
                        /* Убираем горизонтальный скролл на мобильных */
                        .ant-table-container {
                            overflow-x: hidden !important;
                        }
                    }

                    /* Стили для очень маленьких экранов (меньше 420px) */
                    @media (max-width: 420px) {
                        .ant-table-thead > tr > th {
                            padding: 4px 1px !important;
                            font-size: 10px !important;
                        }
                        
                        .ant-table-tbody > tr > td {
                            padding: 4px 1px !important;
                            font-size: 10px !important;
                        }
                        
                        .ant-btn-sm {
                            padding: 1px 2px !important;
                            font-size: 8px !important;
                            height: 20px !important;
                            min-width: 20px !important;
                        }
                        
                        .ant-tag {
                            font-size: 8px !important;
                            padding: 0px 2px !important;
                        }
                        
                        .ant-pagination {
                            font-size: 9px !important;
                        }
                        
                        .ant-pagination-item,
                        .ant-pagination-prev,
                        .ant-pagination-next {
                            min-width: 20px !important;
                            height: 20px !important;
                            line-height: 18px !important;
                        }
                        
                        /* Максимальная компактность для очень маленьких экранов */
                        .ant-table-tbody > tr > td:first-child,
                        .ant-table-thead > tr > th:first-child {
                            max-width: none !important;
                            width: 100% !important;
                        }
                        
                        .ant-table-tbody > tr > td:last-child,
                        .ant-table-thead > tr > th:last-child {
                            width: 60px !important;
                            min-width: 60px !important;
                        }
                    }

                    /* Стили для модальных окон на мобильных устройствах */
                    @media (max-width: 768px) {
                        .ant-modal {
                            margin: 0 !important;
                            top: 20px !important;
                            max-width: 90% !important;
                        }
                        
                        .ant-modal-content {
                            border-radius: 8px !important;
                        }
                        
                        .ant-modal-header {
                            padding: 12px 16px !important;
                        }
                        
                        .ant-modal-title {
                            font-size: 14px !important;
                        }
                        
                        .ant-modal-body {
                            padding: 12px 16px !important;
                        }
                        
                        .ant-modal-footer {
                            padding: 8px 16px !important;
                        }
                        
                        .ant-btn {
                            font-size: 12px !important;
                            height: 32px !important;
                            padding: 0 12px !important;
                        }
                    }

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
                key={forceUpdate}
                columns={columns}
                dataSource={inventory}
                rowKey="id"
                loading={loading}
                size={isMobile ? 'small' : 'middle'}
                scroll={isMobile ? undefined : { x: 600 }}
                onRow={(record) => ({
                    style: { 
                        cursor: 'default'
                    }
                })}
                pagination={{
                    pageSize: isMobile ? 5 : 10,
                    showSizeChanger: !isMobile,
                    showQuickJumper: !isMobile,
                    showTotal: (total, range) => isMobile ? 
                        `${range[0]}-${range[1]} из ${total}` : 
                        `${range[0]}-${range[1]} из ${total} предметов`,
                    size: isMobile ? 'small' : 'default',
                }}
                style={{
                    fontSize: isMobile ? '12px' : '14px'
                }}
            />

            {expiredItems.length > 0 && showWriteOffButton && (
                <div style={{ 
                    marginTop: 16, 
                    marginBottom: 16, 
                    padding: isVerySmall ? '8px' : '12px', 
                    backgroundColor: '#fff2f0', 
                    border: '1px solid #ff4d4f', 
                    borderRadius: '6px',
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: isVerySmall ? '6px' : '8px',
                        flexDirection: isVerySmall ? 'column' : 'row'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: isVerySmall ? '12px' : '14px' }} />
                            <span style={{ 
                                fontWeight: 'bold', 
                                color: '#ff4d4f',
                                fontSize: isVerySmall ? '10px' : '12px'
                            }}>
                                {isVerySmall ? 
                                    `${expiredItems.length} просрочено` : 
                                    `Найдено ${expiredItems.length} просроченных предметов`
                                }
                            </span>
                        </div>
                        <Button
                            type="primary"
                            danger
                            icon={<FileTextOutlined />}
                            onClick={openWriteOffModal}
                            size={isVerySmall ? 'small' : 'middle'}
                            style={{
                                fontSize: isVerySmall ? '10px' : '12px',
                                height: isVerySmall ? '24px' : '32px',
                                padding: isVerySmall ? '0 8px' : '0 12px',
                                width: isVerySmall ? '100%' : 'auto'
                            }}
                        >
                            {isVerySmall ? 'Списать' : 'Списать просроченные'}
                        </Button>
                    </div>
                </div>
            )}

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
                    width={isMobile ? '90%' : 520}
                    centered={isMobile}
                    destroyOnClose
                    maskClosable
                    keyboard
                    style={isMobile ? { 
                        top: '20px',
                        marginBottom: '20px'
                    } : undefined}
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

export default InventoryList;
