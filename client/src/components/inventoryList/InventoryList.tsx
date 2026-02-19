import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Checkbox, Progress, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons';
import { InventoryItem } from '../../app/services/inventory';
import { useSizNorms } from '../../hooks/useSizNorms';
import { useResponsive } from '../../hooks/useResponsive';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import * as Dialog from '@radix-ui/react-dialog';
import './InventoryList.css';

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
    const { isMobile, isVerySmall } = useResponsive();
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
        return () => window.removeEventListener('error', handleError);
    }, []);


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

        // Для предметов "до износа" не считаем процент износа
        if (norm.periodType === 'until_worn') {
            return -1; // Специальное значение для предметов "до износа"
        }

        let totalDays = 0;
        let endDate = issueDate;
        if (norm.periodType === 'months') {
            // Точный расчет с использованием dayjs для добавления месяцев
            const months = parseInt(norm.period);
            endDate = issueDate.add(months, 'month');
            totalDays = endDate.diff(issueDate, 'day');
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
        
        // Предметы "до износа" не имеют срока годности
        if (norm.periodType === 'until_worn') {
            return false;
        }
        
        let endDate = issueDate;
        if (norm.periodType === 'months') {
            const months = parseInt(norm.period);
            endDate = issueDate.add(months, 'month');
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
        {
            title: 'Название',
            dataIndex: 'itemName',
            key: 'itemName',
            align: 'left' as const,
            width: isVerySmall ? '100%' : isMobile ? '70%' : undefined,
            ellipsis: true,
            render: (text: string, record: InventoryItem) => (
                <div style={{
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '4px',
                    width: '100%'
                }}>
                    <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
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
                    color: '#1890ff',
                    textAlign: 'center',
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
            align: 'center' as const,
            sorter: (a: InventoryItem, b: InventoryItem) => {
                const typeOrder: { [key: string]: number } = {
                    'спецодежда': 1,
                    'сиз': 2,
                    'инструмент': 3,
                    'оборудование': 4
                };
                const orderA = typeOrder[a.itemType] || 999;
                const orderB = typeOrder[b.itemType] || 999;
                return orderA - orderB;
            },
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
            align: 'center' as const,
            render: (date: string) => {
                if (!date) return '-';
                return new Date(date).toLocaleDateString('ru-RU');
            }
        },
        {
            title: 'Процент износа',
            key: 'wearPercentage',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: InventoryItem) => {
                // Проверяем норматив предмета
                const norm = findNormByItemName(record.itemName);
                
                // Для предметов "до износа" показываем другой текст
                if (norm && norm.periodType === 'until_worn') {
                    const issueDate = record.issueDate ? dayjs(record.issueDate) : null;
                    const daysInUse = issueDate ? dayjs().diff(issueDate, 'day') : 0;
                    
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <Tag color="blue">До износа</Tag>
                            {issueDate && (
                                <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                                    В использовании: {daysInUse} дн.
                                </div>
                            )}
                        </div>
                    );
                }
                
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
            align: 'center' as const,
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
            width: 90,
            align: 'center' as const,
            render: (_: any, record: InventoryItem) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        style={{ color: '#1890ff', padding: '4px 6px', minWidth: '28px' }}
                        onClick={() => onEdit(record)}
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        style={{ padding: '4px 6px', minWidth: '28px' }}
                        onClick={() => {
                            if (record.id) {
                                Swal.fire({
                                    title: 'Удалить предмет?',
                                    text: 'Вы уверены, что хотите удалить этот предмет из инвентаря?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Да, удалить',
                                    cancelButtonText: 'Отмена',
                                    confirmButtonColor: '#ff4d4f',
                                    reverseButtons: true,
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        onDelete(record.id!);
                                    } else if (onCancelDelete) {
                                        onCancelDelete(record.id!);
                                    }
                                });
                            }
                        }}
                    />
                </div>
            ),
        },
        ]),
        ...(isMobile ? [{
            title: '',
            key: 'details',
            width: isVerySmall ? 56 : 72,
            align: 'center' as const,
            render: (_: any, record: InventoryItem) => (
                <div style={{ display: 'flex', gap: isVerySmall ? '2px' : '4px', justifyContent: 'center' }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        style={{
                            color: '#1890ff',
                            padding: isVerySmall ? '1px 3px' : '2px 5px',
                            minWidth: isVerySmall ? '22px' : '26px',
                            height: isVerySmall ? '22px' : '26px',
                        }}
                        onClick={() => onEdit(record)}
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        style={{
                            padding: isVerySmall ? '1px 3px' : '2px 5px',
                            minWidth: isVerySmall ? '22px' : '26px',
                            height: isVerySmall ? '22px' : '26px',
                        }}
                        onClick={() => {
                            if (record.id) {
                                Swal.fire({
                                    title: 'Удалить предмет?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Удалить',
                                    cancelButtonText: 'Отмена',
                                    confirmButtonColor: '#ff4d4f',
                                    reverseButtons: true,
                                }).then((result) => {
                                    if (result.isConfirmed) onDelete(record.id!);
                                });
                            }
                        }}
                    />
                </div>
            ),
        }] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [showWriteOffButton, selectedItems, inventory, isExpired, isMobile, isVerySmall, onEdit, onDelete, handleSelectItem, calculateWearPercentage, getProgressColor, findNormByItemName, onCancelDelete]);

    const expiredItems = useMemo(() => inventory.filter(item => isExpired(item)), [inventory, isExpired]);

    return (
        <>

            <Table
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
                <Dialog.Root
                    open={isWriteOffModalVisible}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsWriteOffModalVisible(false);
                            setSelectedItems([]);
                        }
                    }}
                >
                    <Dialog.Portal>
                        <Dialog.Overlay className="radix-dialog-overlay" />
                        <Dialog.Content
                            className="radix-dialog-content"
                            style={{ maxWidth: isMobile ? '90vw' : '520px' }}
                            aria-describedby={undefined}
                        >
                            <Dialog.Title className="radix-dialog-title">
                                Списание просроченных предметов
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="radix-dialog-close-btn" aria-label="Закрыть">
                                    <CloseOutlined />
                                </button>
                            </Dialog.Close>
                            <div style={{ marginBottom: 16 }}>
                                <p>Выберите предметы для списания:</p>
                                <div className="radix-dialog-scroll" style={{ maxHeight: '300px', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
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
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                Будет списано: {selectedItems.length} из {expiredItems.length} предметов
                            </div>
                            <div className="radix-dialog-footer">
                                <Button onClick={() => { setIsWriteOffModalVisible(false); setSelectedItems([]); }}>
                                    Отмена
                                </Button>
                                <Button type="primary" danger onClick={handleWriteOff}>
                                    Списать
                                </Button>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            )}
        </>
    );
};

export default InventoryList;
