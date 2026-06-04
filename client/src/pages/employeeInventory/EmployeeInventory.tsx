import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import EmployeeHeader from '../../components/employeeHeader/EmployeeHeader';
import { useHeader } from '../../contexts/HeaderContext';
import { useResponsive } from '../../hooks/useResponsive';
import './EmployeeInventory.css';
import { Row, Col, Statistic, Card, Tabs, Modal } from 'antd';
import { MoreOutlined, FilePdfOutlined } from '@ant-design/icons';
import { cleanupMobileBlockers, scheduleCleanupMobileBlockers } from '../../utils/cleanupMobileBlockers';
import InventoryForm from '../../components/inventoryForm/InventoryForm';
import InventoryList from '../../components/inventoryList/InventoryList';
import NormsPanel from '../../components/normsPanel/NormsPanel';
import MobileActionsMenu from '../../components/mobileActionsMenu/MobileActionsMenu';
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
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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
        if (isMobile) {
            window.scrollTo(0, 0);
        }
    };

    const openEditModal = useCallback((item: InventoryItem) => {
        setEditingItem(item);
        setIsModalVisible(true);
        setError("");
        if (isMobile) {
            window.scrollTo(0, 0);
        }
    }, [isMobile]);

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingItem(null);
        setError("");
    };

    const closeActionsMenu = useCallback(() => {
        setIsActionsDropdownOpen(false);
        cleanupMobileBlockers();
    }, []);

    const openNormsModal = useCallback(() => {
        closeActionsMenu();
        setIsNormsModalVisible(true);
    }, [closeActionsMenu]);

    const closeNormsModal = useCallback(() => {
        setIsNormsModalVisible(false);
        scheduleCleanupMobileBlockers();
    }, []);

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
                        <>
                            <MobileActionsMenu
                                open={isActionsDropdownOpen}
                                onOpenChange={setIsActionsDropdownOpen}
                                trigger={
                                    <button
                                        type="button"
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
                                }
                            >
                                <button
                                    type="button"
                                    className="mobile-actions-menu-item mobile-actions-menu-item--green"
                                    onClick={() => {
                                        closeActionsMenu();
                                        openAddModal();
                                    }}
                                >
                                    + Добавить предмет
                                </button>
                                <button
                                    type="button"
                                    className="mobile-actions-menu-item mobile-actions-menu-item--blue"
                                    onClick={openNormsModal}
                                >
                                    Нормативы СИЗ
                                </button>
                                <button
                                    type="button"
                                    className="mobile-actions-menu-item mobile-actions-menu-item--export"
                                    onClick={() => {
                                        closeActionsMenu();
                                        setIsExportModalOpen(true);
                                    }}
                                >
                                    <FilePdfOutlined />
                                    Экспорт карточки
                                </button>
                            </MobileActionsMenu>
                            <ExportCard
                                employee={employee}
                                inventory={allInventory}
                                sizNorms={sizNorms}
                                showTrigger={false}
                                exportModalOpen={isExportModalOpen}
                                onExportModalOpenChange={setIsExportModalOpen}
                            />
                        </>
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
                                    borderRadius: '6px', border: 'none',
                                    background: '#1890ff', color: '#fff',
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
                            <select
                                className="inventory-tab-select"
                                value={activeTab}
                                onChange={(event) => handleTabChange(event.target.value)}
                                aria-label="Выбор раздела инвентаря"
                            >
                                {tabMenuItems.map(({ key, label }) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
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

            <Modal
                title={editingItem ? "Редактировать предмет" : "Добавить предмет"}
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                width={isMobile ? '95vw' : 600}
                centered={!isMobile}
                destroyOnClose
                style={isMobile ? { top: 12, paddingBottom: 0 } : undefined}
                bodyStyle={isMobile ? { maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' } : undefined}
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

            {/* Нормативы СИЗ — отдельная панель NormsPanel (без Ant Modal) */}
            <NormsPanel open={isNormsModalVisible} onClose={closeNormsModal} />

            </div>
        </Layout>
    );
};

export default EmployeeInventory;