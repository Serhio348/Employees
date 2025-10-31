import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import EmployeeHeader from '../../components/employeeHeader/EmployeeHeader';
import { useHeader } from '../../contexts/HeaderContext';
import { Row, Col, Button, Modal, Typography, Statistic, Card, Tabs, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { PlusOutlined, BookOutlined } from '@ant-design/icons';
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
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';

const { Title, Text } = Typography;

const EmployeeInventory = () => {
    const { id: employeeId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [error, setError] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isNormsModalVisible, setIsNormsModalVisible] = useState(false);
    const [isOpeningNormsModal, setIsOpeningNormsModal] = useState(false);
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
    const [isMobile, setIsMobile] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const { hideHeader } = useHeader();

    const { data: allInventory = [], isLoading } = useGetEmployeeInventoryQuery(employeeId!, {
        skip: !employeeId
    });
    const { data: employee } = useGetEmployeeQuery(employeeId!, {
        skip: !employeeId
    });

    // Отладочная информация
    console.log('EmployeeInventory Debug:', {
        employeeId,
        user: user ? 'authenticated' : 'not authenticated',
        employee: employee ? 'loaded' : 'not loaded',
        allInventory: allInventory.length,
        isLoading
    });

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
        // Обновляем URL при смене вкладки
        const newUrl = `${window.location.pathname}?tab=${key}`;
        window.history.pushState({}, '', newUrl);
        // Принудительно обновляем компонент для предотвращения зависания
        setForceUpdate(prev => prev + 1);
    };
    
    // Функция для получения контента текущего таба
    const getCurrentTabContent = () => {
        switch (activeTab) {
            case 'спецодежда':
                return (
                    <InventoryList
                        key={`спецодежда-${forceUpdate}`}
                        inventory={activeInventory.filter(item => item.itemType === 'спецодежда')}
                        onEdit={openEditModal}
                        onDelete={handleDeleteItem}
                        onViewAddons={handleViewAddons}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                        onWriteOff={handleWriteOff}
                    />
                );
            case 'сиз':
                return (
                    <InventoryList
                        key={`сиз-${forceUpdate}`}
                        inventory={activeInventory.filter(item => item.itemType === 'сиз')}
                        onEdit={openEditModal}
                        onDelete={handleDeleteItem}
                        onViewAddons={handleViewAddons}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                        onWriteOff={handleWriteOff}
                    />
                );
            case 'инструмент':
                return (
                    <InventoryList
                        key={`инструмент-${forceUpdate}`}
                        inventory={activeInventory.filter(item => item.itemType === 'инструмент')}
                        onEdit={openEditModal}
                        onDelete={handleDeleteItem}
                        onViewAddons={handleViewAddons}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                        onWriteOff={handleWriteOff}
                    />
                );
            case 'оборудование':
                return (
                    <InventoryList
                        key={`оборудование-${forceUpdate}`}
                        inventory={activeInventory.filter(item => item.itemType === 'оборудование')}
                        onEdit={openEditModal}
                        onDelete={handleDeleteItem}
                        onViewAddons={handleViewAddons}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                        onWriteOff={handleWriteOff}
                    />
                );
            case 'written-off':
                return (
                    <InventoryList
                        key={`written-off-${forceUpdate}`}
                        inventory={writtenOffInventory}
                        onEdit={openEditModal}
                        onDelete={handleDeleteItem}
                        onViewAddons={handleViewAddons}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                        onWriteOff={handleWriteOff}
                        showWriteOffButton={false}
                    />
                );
            default:
                return (
                    <InventoryList
                        key={`active-${forceUpdate}`}
                        inventory={activeInventory}
                        onEdit={openEditModal}
                        onDelete={handleDeleteItem}
                        onViewAddons={handleViewAddons}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                        onWriteOff={handleWriteOff}
                    />
                );
        }
    };
    
    // Меню для выпадающего списка на мобильных устройствах
    const tabMenuItems = useMemo(() => [
        {
            key: 'active',
            label: `Все активные (${activeInventory.length})`,
        },
        {
            key: 'спецодежда',
            label: `Спецодежда (${activeInventory.filter(item => item.itemType === 'спецодежда').length})`,
        },
        {
            key: 'сиз',
            label: `СИЗ (${activeInventory.filter(item => item.itemType === 'сиз').length})`,
        },
        {
            key: 'инструмент',
            label: `Инструмент (${activeInventory.filter(item => item.itemType === 'инструмент').length})`,
        },
        {
            key: 'оборудование',
            label: `Оборудование (${activeInventory.filter(item => item.itemType === 'оборудование').length})`,
        },
        {
            key: 'written-off',
            label: `Списанный инвентарь (${writtenOffInventory.length})`,
        },
    ], [activeInventory, writtenOffInventory]);
    
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
            // Принудительно обновляем компонент при навигации назад/вперед
            setForceUpdate(prev => prev + 1);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    
    // Обновляем компонент при изменении активного таба
    useEffect(() => {
        setForceUpdate(prev => prev + 1);
    }, [activeTab]);

    // Отслеживаем размер экрана для адаптивности
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        handleResize(); // Вызываем сразу для установки начального состояния
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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


    // Прокрутка к началу страницы при загрузке компонента
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Скрываем хедер при загрузке страницы инвентаря
    useEffect(() => {
        if (employee) {
            hideHeader();
        }
    }, [employee, hideHeader]);

    const handleAddItem = async (values: InventoryItem) => {
        try {
            console.log('EmployeeInventory - handleAddItem called with values:', values);
            if (!employeeId) {
                setError("ID сотрудника не найден");
                return;
            }

            const itemData = { ...values, employeeId: employeeId };
            console.log('EmployeeInventory - sending itemData:', itemData);
            await addInventoryItem(itemData).unwrap();
            setIsModalVisible(false);
            setEditingItem(null);
            setError("");
            // Принудительно обновляем компонент
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error('EmployeeInventory - add item error:', error);
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
            // Принудительно обновляем компонент
            setForceUpdate(prev => prev + 1);
        } catch (error: any) {
            const maybeError = isErrorWithMessage(error);
            if (maybeError) {
                setError(error.data.message);
            } else {
                setError('Неизвестная ошибка при обновлении предмета');
            }
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            setDeletingIds(prev => [...prev, id]);
            await deleteInventoryItem(id).unwrap();
            setError("");
            setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
            // Принудительно обновляем компонент
            setForceUpdate(prev => prev + 1);
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
    };

    const handleCancelDelete = (id: string) => {
        setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
        // Принудительно очищаем состояние
        setTimeout(() => {
            setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
        }, 100);
    };

    const handleWriteOff = async (ids: string[]) => {
        try {
            // Обновляем статус выбранных предметов на "списан"
            for (const id of ids) {
                await updateInventoryItem({ 
                    id, 
                    data: { status: 'списан' } 
                }).unwrap();
            }
            setError("");
            // Принудительно обновляем компонент
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            const maybeError = isErrorWithMessage(error);
            if (maybeError) {
                setError(error.data.message);
            } else {
                setError('Неизвестная ошибка при списании предметов');
            }
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalVisible(true);
        setError("");
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setIsModalVisible(true);
        setError("");
        // Принудительно обновляем компонент
        setForceUpdate(prev => prev + 1);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingItem(null);
        setError("");
        // Принудительно обновляем компонент
        setForceUpdate(prev => prev + 1);
    };

    const openNormsModal = () => {
        console.log('openNormsModal called');
        if (isOpeningNormsModal) {
            console.log('Already opening norms modal, ignoring');
            return;
        }
        setIsOpeningNormsModal(true);
        setIsNormsModalVisible(true);
        // Принудительно обновляем компонент
        setForceUpdate(prev => prev + 1);
    };

    const closeNormsModal = () => {
        console.log('closeNormsModal called');
        setIsOpeningNormsModal(false);
        setIsNormsModalVisible(false);
        // Принудительно обновляем компонент
        setForceUpdate(prev => prev + 1);
    };

    const handleViewAddons = (item: InventoryItem) => {
        navigate(`/inventory/${item.id}/addons`);
    };


    // Статистика для активного инвентаря
    const statistics = useMemo(() => ({
        totalItems: activeInventory.length,
        issuedItems: activeInventory.filter(item => item.status === 'выдан').length,
        returnedItems: activeInventory.filter(item => item.status === 'возвращен').length,
        writtenOffItems: writtenOffInventory.length
    }), [activeInventory, writtenOffInventory]);

    return (
        <Layout key={forceUpdate}>
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
                />
            )}
            
            <div className="inventory-page">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <div style={{ marginBottom: '24px' }}>
                        <Title level={2} style={{ marginBottom: '16px' }}>
                            Инвентарь сотрудника
                        </Title>
                    </div>
                </Col>

                {/* Статистика */}
                <Col span={24}>
                    <Row gutter={isMobile ? 8 : 16}>
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
                </Col>

                <Col span={24}>
                    <div style={{ 
                        background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        marginBottom: '16px',
                        border: '1px solid #d9d9d9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <Text strong style={{ color: '#1890ff', fontSize: '16px', marginBottom: '12px', display: 'block' }}>
                            Управление инвентарем
                        </Text>
                        <div 
                            style={{ 
                                display: 'flex', 
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? '8px' : '12px',
                                flexWrap: 'wrap',
                                alignItems: isMobile ? 'stretch' : 'center'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openAddModal}
                                size={isMobile ? "small" : "middle"}
                            style={{ 
                                    backgroundColor: '#52c41a',
                                    borderColor: '#52c41a',
                                    fontSize: isMobile ? '12px' : '14px',
                                    height: isMobile ? '32px' : '36px',
                                    padding: isMobile ? '0 12px' : '0 16px',
                                    fontWeight: '500',
                                    borderRadius: '6px',
                                    boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {isMobile ? 'Добавить' : 'Добавить предмет'}
                        </Button>
                        <Button
                                type="default"
                            icon={<BookOutlined />}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Button clicked, calling openNormsModal');
                                openNormsModal();
                            }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                size={isMobile ? "small" : "middle"}
                                style={{
                                    fontSize: isMobile ? '12px' : '14px',
                                    height: isMobile ? '32px' : '36px',
                                    padding: isMobile ? '0 12px' : '0 16px',
                                    fontWeight: '500',
                                    borderRadius: '6px',
                                    borderColor: '#1890ff',
                                    color: '#1890ff',
                                    backgroundColor: '#f0f9ff',
                                    width: isMobile ? '100%' : 'auto',
                                    touchAction: 'manipulation',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none'
                                }}
                            >
                                {isMobile ? 'Нормативы' : 'Нормативы СИЗ'}
                        </Button>
                        {employee && (
                                <div style={{ 
                                    marginLeft: isMobile ? '0' : 'auto',
                                    width: isMobile ? '100%' : 'auto'
                                }}>
                            <ExportCard 
                                employee={employee} 
                                inventory={allInventory} 
                            />
                                </div>
                        )}
                        </div>
                    </div>
                </Col>

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
                            {getCurrentTabContent()}
                        </>
                    ) : (
                        <Tabs
                            activeKey={activeTab}
                            onChange={handleTabChange}
                            tabPosition="top"
                            type="line"
                            size="middle"
                            items={[
                            {
                                key: 'active',
                                label: `Все активные (${activeInventory.length})`,
                                children: (
                                    <InventoryList
                                        key={`active-${forceUpdate}`}
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
                                        key={`спецодежда-${forceUpdate}`}
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
                                        key={`сиз-${forceUpdate}`}
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
                                        key={`инструмент-${forceUpdate}`}
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
                                        key={`оборудование-${forceUpdate}`}
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
                                        key={`written-off-${forceUpdate}`}
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
                            ]}
                        />
                    )}
                </Col>
            </Row>

            <Modal
                title={editingItem ? "Редактировать предмет" : "Добавить предмет"}
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                width={isMobile ? '95%' : 600}
                centered={true}
                destroyOnClose
                maskClosable
                keyboard
                style={{ 
                    top: isMobile ? 20 : undefined,
                    margin: isMobile ? '0 auto' : undefined
                }}
                bodyStyle={{ 
                    padding: isMobile ? '16px' : '24px',
                    maxHeight: isMobile ? '80vh' : '70vh',
                    overflowY: 'auto',
                    marginTop: 0,
                    paddingTop: isMobile ? '16px' : '24px'
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
            </Modal>

            <Modal
                title="Нормативы СИЗ"
                open={isNormsModalVisible}
                onCancel={closeNormsModal}
                footer={null}
                width={isMobile ? '95%' : 1000}
                centered={true}
                destroyOnClose
                maskClosable
                keyboard
                style={{ 
                    top: isMobile ? 20 : undefined,
                    margin: isMobile ? '0 auto' : undefined
                }}
                bodyStyle={{ 
                    padding: isMobile ? '16px' : '24px',
                    maxHeight: isMobile ? '80vh' : '70vh',
                    overflowY: 'auto'
                }}
            >
                <SizNormsTable />
            </Modal>

            </div>
            <style>
                {`
                    /* Простые адаптивные стили для вкладок */
                    .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
                        padding: 8px 12px !important;
                        font-size: 12px !important;
                        min-width: 80px !important;
                    }
                    
                    .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
                        background-color: #1890ff !important;
                        color: white !important;
                    }
                    
                    .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab:hover {
                        background-color: #40a9ff !important;
                        color: white !important;
                    }
                    
                    .ant-tabs-content-holder {
                        padding: 8px 0 !important;
                    }
                    
                    .ant-tabs-tabpane {
                        padding: 0 !important;
                    }

                    /* Простые стили для карточки сотрудника (только внутри inventory-page) */
                    .inventory-page .ant-card-body {
                        padding: 16px !important;
                    }
                    
                    .inventory-page .ant-typography h2 {
                        font-size: 16px !important;
                        line-height: 1.2 !important;
                        word-break: break-word !important;
                    }
                    
                    .inventory-page .ant-typography {
                        font-size: 12px !important;
                        word-break: break-word !important;
                    }
                    
                    .inventory-page .ant-typography:last-child {
                        font-size: 9px !important;
                    }

                    /* Адаптивные стили для статистических карточек */
                    @media (max-width: 768px) {
                        .inventory-page .ant-statistic-title {
                            font-size: 12px !important;
                            margin-bottom: 4px !important;
                            line-height: 1.2 !important;
                            word-break: break-word !important;
                        }
                        
                        .inventory-page .ant-statistic-content {
                            font-size: 18px !important;
                            line-height: 1.2 !important;
                        }
                        
                        .inventory-page .ant-card {
                            min-height: 80px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        
                        .inventory-page .ant-card-body {
                            padding: 8px !important;
                            height: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            flex-direction: column !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .inventory-page .ant-statistic-title {
                            font-size: 10px !important;
                            margin-bottom: 2px !important;
                        }
                        
                        .inventory-page .ant-statistic-content {
                            font-size: 16px !important;
                        }
                        
                        .inventory-page .ant-card {
                            min-height: 70px !important;
                        }
                        
                        .inventory-page .ant-card-body {
                            padding: 6px !important;
                        }
                    }

                    /* Стили для модального окна с формой инвентаря */
                    .ant-modal-body {
                        margin-top: 0 !important;
                        padding-top: 24px !important;
                    }
                    
                    .ant-modal-body .ant-form {
                        margin-top: 0 !important;
                        padding-top: 0 !important;
                    }
                    
                    .ant-modal-body .ant-form-item:first-child {
                        margin-top: 0 !important;
                    }

                    /* Адаптивные стили для таблицы нормативов СИЗ */
                    @media (max-width: 768px) {
                        .ant-table-thead > tr > th {
                            padding: 8px 4px !important;
                            font-size: 11px !important;
                            line-height: 1.2 !important;
                        }
                        
                        .ant-table-tbody > tr > td {
                            padding: 8px 4px !important;
                            font-size: 11px !important;
                            line-height: 1.2 !important;
                        }
                        
                        .ant-table-tbody > tr > td .ant-tag {
                            font-size: 10px !important;
                            padding: 2px 6px !important;
                            margin: 1px !important;
                        }
                        
                        .ant-table-tbody > tr > td .ant-btn {
                            font-size: 10px !important;
                            padding: 2px 6px !important;
                            height: 24px !important;
                        }
                        
                        .ant-table-tbody > tr > td .ant-btn .anticon {
                            font-size: 10px !important;
                        }
                        
                        .ant-modal-body {
                            padding-top: 16px !important;
                        }
                    }

                `}
            </style>
        </Layout>
    );
};

export default EmployeeInventory;