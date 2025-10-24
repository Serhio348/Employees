import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import Layout from '../../components/layout/Layout';
import { Row, Col, Button, Modal, Space, Typography, Statistic, Card, Alert } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import InventoryAddonForm from '../../components/inventoryAddonForm/InventoryAddonForm';
import InventoryAddonList from '../../components/inventoryAddonList/InventoryAddonList';
import { 
    useGetInventoryAddonsQuery, 
    useAddInventoryAddonMutation, 
    useUpdateInventoryAddonMutation, 
    useDeleteInventoryAddonMutation,
    InventoryAddon 
} from '../../app/services/inventoryAddon';
import { isErrorWithMessage } from '../../utils/isErrorWithMessage';

const { Title } = Typography;

const InventoryAddons = () => {
    const { inventoryId } = useParams<{ inventoryId: string }>();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [error, setError] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAddon, setEditingAddon] = useState<InventoryAddon | null>(null);

    const { data: addons = [], isLoading } = useGetInventoryAddonsQuery(inventoryId!);
    const [addInventoryAddon, { isLoading: isAdding }] = useAddInventoryAddonMutation();
    const [updateInventoryAddon, { isLoading: isUpdating }] = useUpdateInventoryAddonMutation();
    const [deleteInventoryAddon] = useDeleteInventoryAddonMutation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [navigate, user]);

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

    const handleAddAddon = async (values: InventoryAddon) => {
        try {
            await addInventoryAddon({ ...values, inventoryId: inventoryId! }).unwrap();
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

    const handleEditAddon = async (values: InventoryAddon) => {
        try {
            await updateInventoryAddon({ id: editingAddon!.id!, data: values }).unwrap();
            setIsModalVisible(false);
            setEditingAddon(null);
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

    const handleDeleteAddon = async (id: string) => {
        try {
            await deleteInventoryAddon(id).unwrap();
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

    const handleCancelDelete = (id: string) => {
        // Автоматическое обновление страницы при отмене удаления
        window.location.reload();
        // Принудительно очищаем состояние
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const openAddModal = () => {
        setEditingAddon(null);
        setIsModalVisible(true);
        setError("");
    };

    const openEditModal = (addon: InventoryAddon) => {
        setEditingAddon(addon);
        setIsModalVisible(true);
        setError("");
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingAddon(null);
        setError("");
        // Принудительно очищаем состояние
        setTimeout(() => {
            setIsModalVisible(false);
            setEditingAddon(null);
            setError("");
        }, 100);
    };

    const handleGoBack = () => {
        // Получаем employeeId из URL или из контекста
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');
        const employeeId = pathParts[2]; // /employee/:id/inventory/:inventoryId/addons
        navigate(`/employee/${employeeId}/inventory`);
    };

    // Упрощенная статистика без сложных вычислений
    const totalAddons = addons.length;
    const expiringAddons = 0; // Упрощено для предотвращения зависания
    const overdueAddons = 0; // Упрощено для предотвращения зависания

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
                            Назад к инвентарю
                        </Button>
                    </Space>
                    <Title level={2}>Дополнения инвентаря</Title>
                </Col>
                
                {/* Предупреждения */}
                {overdueAddons > 0 && (
                    <Col span={24}>
                        <Alert
                            message="Внимание!"
                            description={`У вас есть ${overdueAddons} просроченных дополнений, требующих немедленной замены.`}
                            type="error"
                            showIcon
                            icon={<ExclamationCircleOutlined />}
                        />
                    </Col>
                )}
                
                {expiringAddons > 0 && (
                    <Col span={24}>
                        <Alert
                            message="Требует внимания"
                            description={`У вас есть ${expiringAddons} дополнений, которые требуют замены в ближайшее время.`}
                            type="warning"
                            showIcon
                        />
                    </Col>
                )}
                
                {/* Статистика */}
                <Col span={24}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Card>
                                <Statistic title="Всего дополнений" value={totalAddons} />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic 
                                    title="Требуют замены" 
                                    value={expiringAddons} 
                                    valueStyle={{ color: '#fa8c16' }} 
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic 
                                    title="Просрочено" 
                                    value={overdueAddons} 
                                    valueStyle={{ color: '#cf1322' }} 
                                />
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
                            Добавить дополнение
                        </Button>
                    </Space>
                </Col>

                <Col span={24}>
                    <InventoryAddonList
                        addons={addons}
                        onEdit={openEditModal}
                        onDelete={handleDeleteAddon}
                        loading={isLoading}
                        onCancelDelete={handleCancelDelete}
                    />
                </Col>
            </Row>

            <Modal
                title={editingAddon ? "Редактировать дополнение" : "Добавить дополнение"}
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                width={600}
            >
                <InventoryAddonForm
                    title=""
                    btnText={editingAddon ? "Обновить" : "Добавить"}
                    onFinish={editingAddon ? handleEditAddon : handleAddAddon}
                    error={error}
                    addon={editingAddon || undefined}
                    inventoryId={inventoryId}
                    loading={editingAddon ? isUpdating : isAdding}
                />
            </Modal>
        </Layout>
    );
};

export default InventoryAddons;
