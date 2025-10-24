import React, { useState } from 'react';
import { Button, Modal, Space, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import { Employee } from '@prisma/client';
import { InventoryItem } from '../../app/services/inventory';
import * as XLSX from 'xlsx';

interface Props {
    employee: Employee;
    inventory: InventoryItem[];
}

const ExportCard = ({ employee, inventory }: Props) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

    const handleExport = () => {
        if (exportFormat === 'pdf') {
            exportToPDF();
        } else {
            exportToExcel();
        }
        setIsModalVisible(false);
        // Принудительно очищаем состояние
        setTimeout(() => {
            setIsModalVisible(false);
        }, 100);
    };

    const exportToPDF = () => {
        try {
            // Создаем HTML контент для PDF
            const htmlContent = generateHTMLContent();
            
            // Создаем новый window для печати
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
            message.success('PDF экспорт запущен');
        } catch (error) {
            message.error('Ошибка при экспорте в PDF');
            console.error('PDF export error:', error);
        }
    };

    const exportToExcel = () => {
        try {
            // Создаем рабочую книгу Excel
            const workbook = XLSX.utils.book_new();
            
            // Лист с информацией о сотруднике
            const employeeData = [
                ['ЛИЧНАЯ КАРТОЧКА № учета средств индивидуальной защиты'],
                [''],
                ['Информация о работнике'],
                ['Фамилия', employee.lastName],
                ['Имя', employee.firstName],
                ['Отчество', employee.surName || ''],
                ['Возраст', employee.age],
                ['Дата рождения', employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('ru-RU') : ''],
                ['Профессия', employee.profession],
                ['Адрес', employee.address],
                ['Табельный номер', employee.employeeNumber || ''],
                ['Рост', employee.height ? employee.height + ' см' : ''],
                ['Размер одежды', employee.clothingSize || ''],
                ['Размер обуви', employee.shoeSize || ''],
                [''],
                ['Выданный инвентарь'],
                ['№', 'Наименование СИЗ', 'Тип', 'Дата выдачи', 'Количество', 'Статус']
            ];
            
            // Добавляем данные инвентаря
            inventory.forEach((item, index) => {
                employeeData.push([
                    index + 1,
                    item.itemName,
                    item.itemType,
                    item.issueDate ? new Date(item.issueDate).toLocaleDateString('ru-RU') : '',
                    item.quantity,
                    item.status
                ]);
            });
            
            // Создаем лист
            const worksheet = XLSX.utils.aoa_to_sheet(employeeData);
            
            // Настраиваем ширину колонок
            const colWidths = [
                { wch: 5 },   // №
                { wch: 30 }, // Наименование СИЗ
                { wch: 15 }, // Тип
                { wch: 12 }, // Дата выдачи
                { wch: 10 }, // Количество
                { wch: 15 }  // Статус
            ];
            worksheet['!cols'] = colWidths;
            
            // Добавляем лист в книгу
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Личная карточка');
            
            // Создаем и скачиваем файл
            const fileName = `Карточка_${employee.lastName}_${employee.firstName}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            message.success('Excel файл скачан');
        } catch (error) {
            message.error('Ошибка при экспорте в Excel');
            console.error('Excel export error:', error);
        }
    };

    const generateHTMLContent = () => {
        const currentDate = new Date().toLocaleDateString('ru-RU');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Личная карточка работника</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                    .subtitle { font-size: 14px; color: #666; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
                    .employee-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .info-block { flex: 1; margin-right: 20px; }
                    .info-label { font-weight: bold; }
                    .inventory-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .inventory-table th, .inventory-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    .inventory-table th { background-color: #f5f5f5; font-weight: bold; }
                    .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
                    .signature-block { text-align: center; }
                    .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 0 auto 5px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">ЛИЧНАЯ КАРТОЧКА № учета средств индивидуальной защиты</div>
                    <div class="subtitle">Дата составления: ${currentDate}</div>
                </div>

                <div class="section">
                    <div class="section-title">Информация о работнике</div>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
                            ${employee.lastName} ${employee.firstName} ${employee.surName || ''}
                        </div>
                        <div style="font-size: 16px; opacity: 0.9;">
                            ${employee.profession}
                        </div>
                    </div>
                    <div class="employee-info">
                        <div class="info-block">
                            <div><span class="info-label">Фамилия:</span> ${employee.lastName}</div>
                            <div><span class="info-label">Имя:</span> ${employee.firstName}</div>
                            <div><span class="info-label">Отчество:</span> ${employee.surName || '-'}</div>
                        </div>
                        <div class="info-block">
                            <div><span class="info-label">Возраст:</span> ${employee.age} лет</div>
                            <div><span class="info-label">Дата рождения:</span> ${employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('ru-RU') : '-'}</div>
                            <div><span class="info-label">Профессия:</span> ${employee.profession}</div>
                        </div>
                        <div class="info-block">
                            <div><span class="info-label">Адрес:</span> ${employee.address}</div>
                            <div><span class="info-label">Табельный номер:</span> ${employee.employeeNumber || '-'}</div>
                            <div><span class="info-label">Рост:</span> ${employee.height ? employee.height + ' см' : '-'}</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Выданный инвентарь</div>
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Наименование СИЗ</th>
                                <th>Тип</th>
                                <th>Дата выдачи</th>
                                <th>Количество</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventory.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.itemName}</td>
                                    <td>${item.itemType}</td>
                                    <td>${item.issueDate ? new Date(item.issueDate).toLocaleDateString('ru-RU') : '-'}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="signature-section">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div>Подпись работника</div>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div>Подпись ответственного лица</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    };


    return (
        <>
            <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => setIsModalVisible(true)}
            >
                Экспорт карточки
            </Button>

            <Modal
                title="Экспорт личной карточки"
                open={isModalVisible}
                onOk={handleExport}
                onCancel={() => setIsModalVisible(false)}
                okText="Экспортировать"
                cancelText="Отмена"
            >
                <div style={{ marginBottom: 16 }}>
                    <p>Выберите формат экспорта:</p>
                    <Space>
                        <Button
                            type={exportFormat === 'pdf' ? 'primary' : 'default'}
                            icon={<FilePdfOutlined />}
                            onClick={() => setExportFormat('pdf')}
                        >
                            PDF
                        </Button>
                        <Button
                            type={exportFormat === 'excel' ? 'primary' : 'default'}
                            icon={<FileExcelOutlined />}
                            onClick={() => setExportFormat('excel')}
                        >
                            Excel
                        </Button>
                    </Space>
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                    {exportFormat === 'pdf' 
                        ? 'PDF файл будет открыт в новом окне для печати'
                        : 'Excel файл (.xlsx) будет автоматически скачан'
                    }
                </div>
            </Modal>
        </>
    );
};

export default ExportCard;
