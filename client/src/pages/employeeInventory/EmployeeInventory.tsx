import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import { Row, Col, Button, Modal, Space, Typography, Statistic, Card, Tabs } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, BookOutlined, DeleteOutlined } from '@ant-design/icons';
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

const { Title } = Typography;

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

    const { data: allInventory = [], isLoading } = useGetEmployeeInventoryQuery(employeeId!, {
        skip: !employeeId
    });
    const { data: employee } = useGetEmployeeQuery(employeeId!, {
        skip: !employeeId
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

    const handleAddItem = async (values: InventoryItem) => {
        try {
            if (!employeeId) {
                setError("ID сотрудника не найден");
                return;
            }

            const itemData = { ...values, employeeId: employeeId };
            await addInventoryItem(itemData).unwrap();
            setIsModalVisible(false);
            setError("");
            // Автоматическое обновление страницы
            window.location.reload();
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
            // Автоматическое обновление страницы
            window.location.reload();
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
            // Автоматическое обновление страницы
            window.location.reload();
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
        // Автоматическое обновление страницы при отмене удаления
        window.location.reload();
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
            // Автоматическое обновление страницы
            window.location.reload();
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
        // Автоматическое обновление страницы после закрытия модального окна
        window.location.reload();
    };

    const openNormsModal = () => {
        setIsNormsModalVisible(true);
    };

    const closeNormsModal = () => {
        setIsNormsModalVisible(false);
        // Автоматическое обновление страницы после закрытия модального окна с нормативами
        window.location.reload();
    };

    const handleViewAddons = (item: InventoryItem) => {
        navigate(`/inventory/${item.id}/addons`);
    };

    const handleGoBack = () => {
        navigate(`/employee/${employeeId}`);
    };

    // Статистика для активного инвентаря
    const totalItems = activeInventory.length;
    const issuedItems = activeInventory.filter(item => item.status === 'выдан').length;
    const returnedItems = activeInventory.filter(item => item.status === 'возвращен').length;
    const writtenOffItems = writtenOffInventory.length;

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
                    <Title level={2}>
                        Инвентарь сотрудника
                        {employee && (
                            <span style={{ fontSize: '18px', fontWeight: 'normal', marginLeft: '16px' }}>
                                {employee.lastName} {employee.firstName} {employee.surName}
                            </span>
                        )}
                    </Title>
                </Col>

                {/* Статистика */}
                <Col span={24}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Card>
                                <Statistic title="Всего предметов" value={totalItems} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic title="Выдано" value={issuedItems} valueStyle={{ color: '#3f8600' }} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic title="Возвращено" value={returnedItems} valueStyle={{ color: '#1890ff' }} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic title="Списано" value={writtenOffItems} valueStyle={{ color: '#cf1322' }} />
                            </Card>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Space style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openAddModal}
                        >
                            Добавить предмет
                        </Button>
                        <Button
                            type="primary"
                            icon={<BookOutlined />}
                            onClick={openNormsModal}
                        >
                            Нормативы СИЗ
                        </Button>
                        {employee && (
                            <ExportCard 
                                employee={employee} 
                                inventory={allInventory} 
                            />
                        )}
                    </Space>
                </Col>

                <Col span={24}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'active',
                                label: `Активный инвентарь (${activeInventory.length})`,
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
                                label: `Списанный инвентарь (${writtenOffInventory.length})`,
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
        </Layout>
    );
};

export default EmployeeInventory;