import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import { Row, Col, Button, Modal, Space, Typography, Statistic, Card, Tabs } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
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
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('active');
    const [isMobile, setIsMobile] = useState(false);

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
    const [addInventoryItem, { isLoading: isAdding }] = useAddInventoryItemMutation();
    const [updateInventoryItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
    const [deleteInventoryItem] = useDeleteInventoryItemMutation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [navigate, user]);

    // Отслеживаем размер экрана для адаптивности
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Вызываем сразу для установки начального состояния
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
            setError("");
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
    };

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

    const handleViewAddons = (item: InventoryItem) => {
        navigate(`/inventory/${item.id}/addons`);
    };

    const handleGoBack = () => {
        navigate(`/employee/${employeeId}`);
    };

    // Статистика для активного инвентаря
    const statistics = useMemo(() => ({
        totalItems: activeInventory.length,
        issuedItems: activeInventory.filter(item => item.status === 'выдан').length,
        returnedItems: activeInventory.filter(item => item.status === 'возвращен').length,
        writtenOffItems: writtenOffInventory.length
    }), [activeInventory, writtenOffInventory]);

    return (
        <Layout>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Space style={{ marginBottom: 16 }}>
                        <Button
                            type="default"
                            icon={<ArrowLeftOutlined />}
                            onClick={handleGoBack}
                        >
                            Назад к сотруднику
                        </Button>
                    </Space>
                    <div style={{ marginBottom: '24px' }}>
                        <Title level={2} style={{ marginBottom: '16px' }}>
                            Инвентарь сотрудника
                        </Title>
                        {employee && (
                            <Card 
                                style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    marginBottom: '16px'
                                }}
                                bodyStyle={{ padding: isMobile ? '16px' : '20px' }}
                            >
                                {isMobile ? (
                                    // Мобильная версия - иконка сверху
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            color: 'white'
                                        }}>
                                            <UserOutlined />
                                        </div>
                                        <div style={{ 
                                            textAlign: 'center',
                                            width: '100%'
                                        }}>
                                            <Title 
                                                level={2} 
                                                style={{ 
                                                    color: 'white', 
                                                    margin: 0, 
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                    lineHeight: '1.2',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {employee.lastName} {employee.firstName} {employee.surName}
                                            </Title>
                                            <Text 
                                                style={{ 
                                                    color: 'rgba(255, 255, 255, 0.9)', 
                                                    fontSize: '12px',
                                                    display: 'block',
                                                    marginTop: '4px',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {employee.profession}
                                            </Text>
                                            {employee.employeeNumber && (
                                                <Text 
                                                    style={{ 
                                                        color: 'rgba(255, 255, 255, 0.8)', 
                                                        fontSize: '9px',
                                                        display: 'block',
                                                        marginTop: '2px',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    Табельный номер: {employee.employeeNumber}
                                                </Text>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // Десктопная версия - иконка слева
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '16px'
                                    }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: 'white'
                                    }}>
                                        <UserOutlined />
                                    </div>
                                        <div style={{ 
                                            flex: 1, 
                                            textAlign: 'left'
                                        }}>
                                        <Title 
                                            level={2} 
                                            style={{ 
                                                color: 'white', 
                                                margin: 0, 
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                    lineHeight: '1.4',
                                                    wordBreak: 'normal'
                                            }}
                                        >
                                            {employee.lastName} {employee.firstName} {employee.surName}
                                        </Title>
                                        <Text 
                                            style={{ 
                                                color: 'rgba(255, 255, 255, 0.9)', 
                                                fontSize: '16px',
                                                display: 'block',
                                                    marginTop: '4px',
                                                    wordBreak: 'normal'
                                            }}
                                        >
                                            {employee.profession}
                                        </Text>
                                        {employee.employeeNumber && (
                                            <Text 
                                                style={{ 
                                                    color: 'rgba(255, 255, 255, 0.8)', 
                                                    fontSize: '14px',
                                                    display: 'block',
                                                        marginTop: '2px',
                                                        wordBreak: 'normal'
                                                }}
                                            >
                                                Табельный номер: {employee.employeeNumber}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                                )}
                            </Card>
                        )}
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
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: isMobile ? '8px' : '12px',
                            flexWrap: 'wrap',
                            alignItems: isMobile ? 'stretch' : 'center'
                        }}>
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
                            onClick={openNormsModal}
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
                                    width: isMobile ? '100%' : 'auto'
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
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        tabPosition={isMobile ? 'top' : 'top'}
                        type={isMobile ? 'card' : 'line'}
                        size={isMobile ? 'small' : 'middle'}
                        items={[
                            {
                                key: 'active',
                                label: isMobile ? 
                                    `Активный (${activeInventory.length})` : 
                                    `Активный инвентарь (${activeInventory.length})`,
                                children: (
                                    <InventoryList
                                        inventory={activeInventory}
                                        onEdit={openEditModal}
                                        onDelete={handleDeleteItem}
                                        onViewAddons={handleViewAddons}
                                        loading={isLoading}
                                        deletingIds={deletingIds}
                                        onCancelDelete={handleCancelDelete}
                                        onWriteOff={handleWriteOff}
                                    />
                                ),
                            },
                            {
                                key: 'written-off',
                                label: isMobile ? 
                                    `Списанный (${writtenOffInventory.length})` : 
                                    `Списанный инвентарь (${writtenOffInventory.length})`,
                                children: (
                                    <InventoryList
                                        inventory={writtenOffInventory}
                                        onEdit={openEditModal}
                                        onDelete={handleDeleteItem}
                                        onViewAddons={handleViewAddons}
                                        loading={isLoading}
                                        deletingIds={deletingIds}
                                        onCancelDelete={handleCancelDelete}
                                        onWriteOff={handleWriteOff}
                                        showWriteOffButton={false}
                                    />
                                ),
                            },
                        ]}
                    />
                </Col>
            </Row>

            <Modal
                title={editingItem ? "Редактировать предмет" : "Добавить предмет"}
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                width={600}
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
                width={1000}
                style={{ top: 20 }}
            >
                <SizNormsTable />
            </Modal>

            <style>
                {`
                    /* Адаптивные стили для вкладок на мобильных устройствах */
                    @media (max-width: 768px) {
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
                    }

                    /* Адаптивные стили для карточки сотрудника */
                    @media (max-width: 768px) {
                        .ant-card-body {
                            padding: 16px !important;
                        }
                        
                        .ant-typography h2 {
                            font-size: 16px !important;
                            line-height: 1.2 !important;
                            word-break: break-word !important;
                        }
                        
                        .ant-typography {
                            font-size: 12px !important;
                            word-break: break-word !important;
                        }
                        
                        /* Дополнительные стили для табельного номера */
                        .ant-typography:last-child {
                            font-size: 9px !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .ant-typography h2 {
                            font-size: 14px !important;
                        }
                        
                        .ant-typography {
                            font-size: 11px !important;
                        }
                        
                        .ant-typography:last-child {
                            font-size: 8px !important;
                        }
                    }

                    /* Адаптивные стили для статистических карточек */
                    @media (max-width: 768px) {
                        .ant-statistic-title {
                            font-size: 12px !important;
                            margin-bottom: 4px !important;
                            line-height: 1.2 !important;
                            word-break: break-word !important;
                        }
                        
                        .ant-statistic-content {
                            font-size: 18px !important;
                            line-height: 1.2 !important;
                        }
                        
                        .ant-card {
                            min-height: 80px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                        
                        .ant-card-body {
                            padding: 8px !important;
                            height: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            flex-direction: column !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .ant-statistic-title {
                            font-size: 10px !important;
                            margin-bottom: 2px !important;
                        }
                        
                        .ant-statistic-content {
                            font-size: 16px !important;
                        }
                        
                        .ant-card {
                            min-height: 70px !important;
                        }
                        
                        .ant-card-body {
                            padding: 6px !important;
                        }
                    }

                `}
            </style>
        </Layout>
    );
};

export default EmployeeInventory;