import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import EmployeeHeader from '../../components/employeeHeader/EmployeeHeader';
import { useHeader } from '../../contexts/HeaderContext';
import { useResponsive } from '../../hooks/useResponsive';
import './EmployeeInventory.css';
import { Row, Col, Button, Statistic, Card, Tabs, Dropdown } from 'antd';
import { DownOutlined, CloseOutlined, MoreOutlined } from '@ant-design/icons';
import * as Dialog from '@radix-ui/react-dialog';
import InventoryForm from '../../components/inventoryForm/InventoryForm';
import InventoryList from '../../components/inventoryList/InventoryList';
import SizNormsTable from '../../components/sizNormsTable/SizNormsTable';
import ExportCard from '../../components/exportCard/ExportCard';
import {
    useGetEmployeeInventoryQuery,
    useAddInventoryItemMutation,
    useUpdateInventoryItemMutation,
    useDeleteInventoryItemMutation,
    InventoryItem
} from '../../app/services/inventory';
import { useGetEmployeeQuery } from '../../app/services/employees';
import { useGetAllSizNormsQuery } from '../../app/services/sizNorms';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';

const EmployeeInventory = () => {
    const { id: employeeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [error, setError] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isNormsModalVisible, setIsNormsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [, setDeletingIds] = useState<string[]>([]);
    // Получаем активную вкладку из URL параметров
    const getTabFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        // Поддерживаем старые значения и новые с фильтрами
        if (tab === 'written-off') return 'written-off';
        if (tab && ['спецодежда', 'сиз', 'инструмент', 'оборудование'].includes(tab)) {
            return tab;
        }
        return 'active';
    };
    const [activeTab, setActiveTab] = useState(getTabFromUrl());
    const { isMobile } = useResponsive();
    const { hideHeader } = useHeader();

    const { data: allInventory = [], isLoading } = useGetEmployeeInventoryQuery(employeeId!, {
        skip: !employeeId
    });
    const { data: employee } = useGetEmployeeQuery(employeeId!, {
        skip: !employeeId
    });
    const { data: sizNorms = [] } = useGetAllSizNormsQuery();

    // Разделяем инвентарь на активный и списанный
    const activeInventory = allInventory.filter(item => item.status !== 'списан');
    const writtenOffInventory = allInventory.filter(item => item.status === 'списан');
    
    // Функция для получения названия текущего таба
    const getTabLabel = (key: string): string => {
        const tabLabels: { [key: string]: string } = {
            'active': isMobile ? `Все (${activeInventory.length})` : `Все активные (${activeInventory.length})`,
            'спецодежда': `Спецодежда (${activeInventory.filter(item => item.itemType === 'спецодежда').length})`,
            'сиз': `СИЗ (${activeInventory.filter(item => item.itemType === 'сиз').length})`,
            'инструмент': `Инструмент (${activeInventory.filter(item => item.itemType === 'инструмент').length})`,
            'оборудование': `Оборудование (${activeInventory.filter(item => item.itemType === 'оборудование').length})`,
            'written-off': isMobile ? `Списанный (${writtenOffInventory.length})` : `Списанный инвентарь (${writtenOffInventory.length})`
        };
        return tabLabels[key] || key;
    };
    
    // Функция для обработки смены таба
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        const newUrl = `${window.location.pathname}?tab=${key}`;
        window.history.pushState({}, '', newUrl);
    };
    
    const [addInventoryItem, { isLoading: isAdding }] = useAddInventoryItemMutation();
    const [updateInventoryItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
    const [deleteInventoryItem] = useDeleteInventoryItemMutation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [navigate, user]);

    // Отслеживаем изменения URL при навигации
    useEffect(() => {
        const handlePopState = () => {
            setActiveTab(getTabFromUrl());
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    

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


    // Блокируем скрол страницы — прокрутка только внутри таблицы
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Скрываем хедер при загрузке страницы инвентаря
    useEffect(() => {
        if (employee) {
            hideHeader();
        }
    }, [employee, hideHeader]);

    const handleAddItem = async (values: InventoryItem) => {
        try {
            if (!employeeId) {
                setError("ID сотрудника не найден");
                return;
            }
            const itemData = { ...values, employeeId: employeeId };
            await addInventoryItem(itemData).unwrap();
            setIsModalVisible(false);
            setEditingItem(null);
            setError("");
        } catch (error) {
            const maybeError = isErrorWithMessage(error);
            if (maybeError) {
                setError(error.data.message);
            } else {
                setError('Неизвестная ошибка');
            }
        }
    };

    const handleEditItem = async (values: InventoryItem) => {
        try {
            if (!editingItem?.id) {
                setError("ID предмета не найден");
                return;
            }

            const itemData = { ...values, employeeId: employeeId! };
            setError("");

            if (isUpdating) {
                return;
            }

            await updateInventoryItem({ id: editingItem.id, data: itemData }).unwrap();
            setIsModalVisible(false);
            setEditingItem(null);
            setError("");
        } catch (error: any) {
            const maybeError = isErrorWithMessage(error);
            if (maybeError) {
                setError(error.data.message);
            } else {
                setError('Неизвестная ошибка при обновлении предмета');
            }
        }
    };

    const handleDeleteItem = useCallback(async (id: string) => {
        try {
            setDeletingIds(prev => [...prev, id]);
            await deleteInventoryItem(id).unwrap();
            setError("");
        } catch (error) {
            const maybeError = isErrorWithMessage(error);
            if (maybeError) {
                setError(error.data.message);
            } else {
                setError('Неизвестная ошибка при удалении предмета');
            }
        } finally {
            setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
        }
    }, [deleteInventoryItem]);

    const handleCancelDelete = useCallback((id: string) => {
        setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
    }, []);

    const handleWriteOff = useCallback(async (ids: string[]) => {
        try {
            for (const id of ids) {
                await updateInventoryItem({ id, data: { status: 'списан' } }).unwrap();
            }
            setError("");
        } catch (error) {
            const maybeError = isErrorWithMessage(error);
            if (maybeError) {
                setError(error.data.message);
            } else {
                setError('Неизвестная ошибка при списании предметов');
            }
        }
    }, [updateInventoryItem]);

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalVisible(true);
        setError("");
    };

    const openEditModal = useCallback((item: InventoryItem) => {
        setEditingItem(item);
        setIsModalVisible(true);
        setError("");
    }, []);

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingItem(null);
        setError("");
    };

    const openNormsModal = () => {
        setIsNormsModalVisible(true);
    };

    const closeNormsModal = () => {
        setIsNormsModalVisible(false);
    };

    const handleViewAddons = useCallback((item: InventoryItem) => {
        navigate(`/inventory/${item.id}/addons`);
    }, [navigate]);

    // Единый источник данных для табов (используется и в desktop Tabs, и в mobile Dropdown)
    const tabItems = useMemo(() => [
        {
            key: 'active',
            label: `Все активные (${activeInventory.length})`,
            children: (
                <InventoryList
                    key="active"
                    inventory={activeInventory}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onViewAddons={handleViewAddons}
                    loading={isLoading}
                    onCancelDelete={handleCancelDelete}
                    onWriteOff={handleWriteOff}
                />
            ),
        },
        {
            key: 'спецодежда',
            label: `Спецодежда (${activeInventory.filter(item => item.itemType === 'спецодежда').length})`,
            children: (
                <InventoryList
                    key="спецодежда"
                    inventory={activeInventory.filter(item => item.itemType === 'спецодежда')}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onViewAddons={handleViewAddons}
                    loading={isLoading}
                    onCancelDelete={handleCancelDelete}
                    onWriteOff={handleWriteOff}
                />
            ),
        },
        {
            key: 'сиз',
            label: `СИЗ (${activeInventory.filter(item => item.itemType === 'сиз').length})`,
            children: (
                <InventoryList
                    key="сиз"
                    inventory={activeInventory.filter(item => item.itemType === 'сиз')}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onViewAddons={handleViewAddons}
                    loading={isLoading}
                    onCancelDelete={handleCancelDelete}
                    onWriteOff={handleWriteOff}
                />
            ),
        },
        {
            key: 'инструмент',
            label: `Инструмент (${activeInventory.filter(item => item.itemType === 'инструмент').length})`,
            children: (
                <InventoryList
                    key="инструмент"
                    inventory={activeInventory.filter(item => item.itemType === 'инструмент')}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onViewAddons={handleViewAddons}
                    loading={isLoading}
                    onCancelDelete={handleCancelDelete}
                    onWriteOff={handleWriteOff}
                />
            ),
        },
        {
            key: 'оборудование',
            label: `Оборудование (${activeInventory.filter(item => item.itemType === 'оборудование').length})`,
            children: (
                <InventoryList
                    key="оборудование"
                    inventory={activeInventory.filter(item => item.itemType === 'оборудование')}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onViewAddons={handleViewAddons}
                    loading={isLoading}
                    onCancelDelete={handleCancelDelete}
                    onWriteOff={handleWriteOff}
                />
            ),
        },
        {
            key: 'written-off',
            label: `Списанный инвентарь (${writtenOffInventory.length})`,
            children: (
                <InventoryList
                    key="written-off"
                    inventory={writtenOffInventory}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onViewAddons={handleViewAddons}
                    loading={isLoading}
                    onCancelDelete={handleCancelDelete}
                    onWriteOff={handleWriteOff}
                    showWriteOffButton={false}
                />
            ),
        },
    ], [activeInventory, writtenOffInventory, openEditModal, handleDeleteItem, handleViewAddons, isLoading, handleCancelDelete, handleWriteOff]);

    const tabMenuItems = tabItems.map(({ key, label }) => ({ key, label }));

    // Статистика для активного инвентаря
    const statistics = useMemo(() => ({
        totalItems: activeInventory.length,
        issuedItems: activeInventory.filter(item => item.status === 'выдан').length,
        returnedItems: activeInventory.filter(item => item.status === 'возвращен').length,
        writtenOffItems: writtenOffInventory.length
    }), [activeInventory, writtenOffInventory]);

    return (
        <Layout>
            {employee && (
                <EmployeeHeader
                    employee={{
                        id: employee.id,
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        surName: employee.surName,
                        profession: employee.profession,
                        employeeNumber: employee.employeeNumber
                    }}
                    backPath={`/employee/${employeeId}`}
                    actions={isMobile ? (
                        <Dropdown
                            trigger={['click']}
                            dropdownRender={() => (
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    minWidth: '190px',
                                }}>
                                    <button
                                        onClick={openAddModal}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', borderRadius: '6px',
                                            border: 'none', background: '#52c41a',
                                            color: '#fff', cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: '14px', width: '100%',
                                        }}
                                    >
                                        + Добавить предмет
                                    </button>
                                    <button
                                        onClick={openNormsModal}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 12px', borderRadius: '6px',
                                            border: '1px solid #1890ff', background: '#fff',
                                            color: '#1890ff', cursor: 'pointer',
                                            fontFamily: 'inherit', fontSize: '14px', width: '100%',
                                        }}
                                    >
                                        Нормативы СИЗ
                                    </button>
                                    <ExportCard
                                        employee={employee}
                                        inventory={allInventory}
                                        sizNorms={sizNorms}
                                    />
                                </div>
                            )}
                        >
                            <button
                                style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    height: '32px', padding: '0 12px', fontSize: '20px',
                                    borderRadius: '6px', border: '1px solid #d9d9d9',
                                    background: '#fff', color: 'rgba(0,0,0,0.88)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                <MoreOutlined />
                            </button>
                        </Dropdown>
                    ) : (
                        <>
                            <button
                                onClick={openAddModal}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    height: '32px', padding: '0 15px', fontSize: '14px',
                                    borderRadius: '6px', border: 'none',
                                    background: '#52c41a', color: '#fff',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                + Добавить предмет
                            </button>
                            <button
                                onClick={openNormsModal}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    height: '32px', padding: '0 15px', fontSize: '14px',
                                    borderRadius: '6px', border: '1px solid #1890ff',
                                    background: '#fff', color: '#1890ff',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Нормативы СИЗ
                            </button>
                            <ExportCard
                                employee={employee}
                                inventory={allInventory}
                                sizNorms={sizNorms}
                            />
                        </>
                    )}
                />
            )}
            
            <div className="inventory-page">
            <Row gutter={[16, 16]}>
                {/* Статистика — только на десктопе */}
                {!isMobile && <Col span={24}>
                    <Row gutter={16}>
                        <Col span={isMobile ? 12 : 6}>
                            <Card style={{ 
                                textAlign: 'center',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                height: isMobile ? 'auto' : 'auto',
                                minHeight: isMobile ? '80px' : 'auto'
                            }}>
                                <Statistic 
                                    title={isMobile ? "Всего" : "Всего предметов"} 
                                    value={statistics.totalItems}
                                    valueStyle={{ 
                                        fontSize: isMobile ? '18px' : '24px',
                                        fontWeight: 'bold',
                                        color: '#1890ff'
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={isMobile ? 12 : 6}>
                            <Card style={{ 
                                textAlign: 'center',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                height: isMobile ? 'auto' : 'auto',
                                minHeight: isMobile ? '80px' : 'auto'
                            }}>
                                <Statistic 
                                    title="Выдано" 
                                    value={statistics.issuedItems} 
                                    valueStyle={{ 
                                        color: '#3f8600',
                                        fontSize: isMobile ? '18px' : '24px',
                                        fontWeight: 'bold'
                                    }} 
                                />
                            </Card>
                        </Col>
                        <Col span={isMobile ? 12 : 6}>
                            <Card style={{ 
                                textAlign: 'center',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                height: isMobile ? 'auto' : 'auto',
                                minHeight: isMobile ? '80px' : 'auto'
                            }}>
                                <Statistic 
                                    title="Возвращено" 
                                    value={statistics.returnedItems} 
                                    valueStyle={{ 
                                        color: '#1890ff',
                                        fontSize: isMobile ? '18px' : '24px',
                                        fontWeight: 'bold'
                                    }} 
                                />
                            </Card>
                        </Col>
                        <Col span={isMobile ? 12 : 6}>
                            <Card style={{ 
                                textAlign: 'center',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                height: isMobile ? 'auto' : 'auto',
                                minHeight: isMobile ? '80px' : 'auto'
                            }}>
                                <Statistic 
                                    title="Списано" 
                                    value={statistics.writtenOffItems} 
                                    valueStyle={{ 
                                        color: '#cf1322',
                                        fontSize: isMobile ? '18px' : '24px',
                                        fontWeight: 'bold'
                                    }} 
                                />
                            </Card>
                        </Col>
                    </Row>
                </Col>}

                <Col span={24}>
                    {isMobile ? (
                        <>
                            <Dropdown
                                menu={{
                                    items: tabMenuItems,
                                    onClick: ({ key }) => handleTabChange(key),
                                    selectedKeys: [activeTab],
                                }}
                                trigger={['click']}
                                placement="bottomLeft"
                            >
                                <Button
                                    style={{
                                        width: '100%',
                                        marginBottom: '16px',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        height: '40px',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    <span>{getTabLabel(activeTab)}</span>
                                    <DownOutlined />
                                </Button>
                            </Dropdown>
                            {tabItems.find(t => t.key === activeTab)?.children ?? tabItems[0].children}
                        </>
                    ) : (
                        <Tabs
                            activeKey={activeTab}
                            onChange={handleTabChange}
                            tabPosition="top"
                            type="line"
                            size="middle"
                            items={tabItems}
                        />
                    )}
                </Col>
            </Row>

            <Dialog.Root open={isModalVisible} onOpenChange={(open) => { if (!open) closeModal(); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="radix-dialog-overlay" />
                    <Dialog.Content
                        className="radix-dialog-content"
                        style={{ maxWidth: isMobile ? '95vw' : '600px' }}
                        aria-describedby={undefined}
                    >
                        <Dialog.Title className="radix-dialog-title">
                            {editingItem ? "Редактировать предмет" : "Добавить предмет"}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="radix-dialog-close-btn" aria-label="Закрыть">
                                <CloseOutlined />
                            </button>
                        </Dialog.Close>
                        <div
                            style={{
                                padding: isMobile ? '4px 0' : '8px 0',
                            }}
                        >
                            <InventoryForm
                                title=""
                                btnText={editingItem ? "Обновить" : "Добавить"}
                                onFinish={editingItem ? handleEditItem : handleAddItem}
                                error={error}
                                item={editingItem || undefined}
                                employeeId={employeeId}
                                loading={isUpdating || isAdding}
                            />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={isNormsModalVisible} onOpenChange={(open) => { if (!open) closeNormsModal(); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="radix-dialog-overlay" />
                    <Dialog.Content
                        className="radix-dialog-content"
                        style={{ maxWidth: isMobile ? '95vw' : '1000px', width: '90vw' }}
                        aria-describedby={undefined}
                    >
                        <Dialog.Title className="radix-dialog-title">
                            Нормативы СИЗ
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="radix-dialog-close-btn" aria-label="Закрыть">
                                <CloseOutlined />
                            </button>
                        </Dialog.Close>
                        <div
                            className="radix-dialog-scroll"
                            style={{ maxHeight: isMobile ? '70vh' : '65vh' }}
                        >
                            <SizNormsTable />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            </div>
        </Layout>
    );
};

export default EmployeeInventory;