import React, { useState } from 'react';
import { Button, Modal, Space, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import { Employee } from '@prisma/client';
import { InventoryItem } from '../../app/services/inventory';
import { SizNorm } from '../../app/services/sizNorms';
import * as XLSX from 'xlsx';

interface Props {
    employee: Employee;
    inventory: InventoryItem[];
    sizNorms: SizNorm[];
}

const ExportCard = ({ employee, inventory, sizNorms }: Props) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

    // Расчёт % износа по нормам СИЗ
    const calculateWearPercentage = (item: InventoryItem): number => {
        if (!item.issueDate) return 0;

        const norm = sizNorms.find(n => {
            const normName = n.name.toLowerCase().trim();
            const itemName = item.itemName.toLowerCase().trim();
            return normName === itemName
                || itemName.includes(normName)
                || normName.includes(itemName);
        });

        if (!norm || norm.periodType === 'until_worn') return 0;

        const periodMonths = parseFloat(norm.period);
        if (isNaN(periodMonths) || periodMonths <= 0) return 0;

        const issueDate = new Date(item.issueDate);
        const now = new Date();
        const monthsElapsed =
            (now.getFullYear() - issueDate.getFullYear()) * 12 +
            (now.getMonth() - issueDate.getMonth()) +
            (now.getDate() - issueDate.getDate()) / 30;

        return Math.min(Math.round((monthsElapsed / periodMonths) * 100), 100);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const part = dateStr.split('T')[0];
        const [y, m, d] = part.split('-');
        return `${d}.${m}.${y}`;
    };

    const normPeriodLabel = (norm: SizNorm) => {
        if (norm.periodType === 'until_worn') return 'до износа';
        const months = parseFloat(norm.period);
        if (months === 12) return '1 год';
        if (months === 24) return '2 года';
        if (months === 36) return '3 года';
        return `${months} мес.`;
    };

    const handleExport = () => {
        if (exportFormat === 'pdf') {
            exportToPDF();
        } else {
            exportToExcel();
        }
        setIsModalVisible(false);
    };

    const exportToPDF = () => {
        try {
            const htmlContent = generateHTMLContent();
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.document.title = ' ';
                    printWindow.print();
                }, 500);
            }
            message.success('PDF открыт для печати');
        } catch (error) {
            message.error('Ошибка при экспорте в PDF');
            console.error('PDF export error:', error);
        }
    };

    const exportToExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // ─── Лист 1: Личная карточка ──────────────────────────────────
            const cardData: any[][] = [
                ['ЛИЧНАЯ КАРТОЧКА №', '', '', 'учета средств индивидуальной защиты'],
                [],
                ['Фамилия', employee.lastName, '', 'Рост', employee.height ? `${employee.height} см` : ''],
                ['Собственное имя', employee.firstName, '', 'Размер одежды', employee.clothingSize || ''],
                ['Отчество', employee.surName || '', '', 'Размер обуви', employee.shoeSize || ''],
                ['Табельный номер', employee.employeeNumber || ''],
                ['Профессия (должность)', employee.profession],
                [],
            ];

            // Нормы СИЗ
            if (sizNorms.length > 0) {
                cardData.push(['Предусмотрено по установленным нормам:']);
                cardData.push([
                    'Наименование средства индивидуальной защиты (СИЗ)',
                    'Классификация (маркировка)',
                    'Норма выдачи',
                ]);
                sizNorms.forEach(norm => {
                    cardData.push([
                        norm.name,
                        norm.classification || '',
                        `${norm.quantity ?? 1} / ${normPeriodLabel(norm)}`,
                    ]);
                });
                cardData.push([]);
            }

            const ws1 = XLSX.utils.aoa_to_sheet(cardData);
            ws1['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 4 }, { wch: 16 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws1, 'Карточка');

            // ─── Лист 2: Выданный инвентарь ───────────────────────────────
            const inventoryData: any[][] = [
                [
                    'Наименование СИЗ',
                    'Дата выдачи',
                    'Количество',
                    '% износа',
                    'Статус',
                ],
            ];
            inventory.forEach(item => {
                inventoryData.push([
                    item.itemName,
                    formatDate(item.issueDate),
                    item.quantity,
                    item.status !== 'списан' ? `${calculateWearPercentage(item)}%` : '—',
                    item.status,
                ]);
            });

            const ws2 = XLSX.utils.aoa_to_sheet(inventoryData);
            ws2['!cols'] = [
                { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
            ];
            XLSX.utils.book_append_sheet(wb, ws2, 'Инвентарь');

            XLSX.writeFile(wb, `Карточка_${employee.lastName}_${employee.firstName}.xlsx`);
            message.success('Excel файл скачан');
        } catch (error) {
            message.error('Ошибка при экспорте в Excel');
            console.error('Excel export error:', error);
        }
    };

    const generateHTMLContent = () => {
        const activeItems = inventory.filter(i => i.status !== 'списан');

        const normsRows = sizNorms.map(norm => `
            <tr>
                <td>${norm.name}</td>
                <td style="text-align:center">${norm.classification || ''}</td>
                <td style="text-align:center">${norm.quantity ?? 1}</td>
                <td style="text-align:center">${normPeriodLabel(norm)}</td>
            </tr>`).join('');

        const inventoryRows = activeItems.map(item => {
            const wear = calculateWearPercentage(item);
            return `
            <tr>
                <td>${item.itemName}</td>
                <td style="text-align:center">${formatDate(item.issueDate)}</td>
                <td style="text-align:center">${item.quantity}</td>
                <td style="text-align:center">${wear > 0 ? wear + '%' : ''}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>`;
        }).join('');

        const fullName = `${employee.lastName} ${employee.firstName} ${employee.surName || ''}`.trim();
        const today = new Date();
        const exportDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

        return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Личная карточка СИЗ</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    line-height: 1.3;
    padding: 15mm 12mm 12mm 20mm;
  }

  /* ── Шапка ── */
  .org-name {
    text-align: left;
    font-size: 10pt;
    margin-bottom: 10pt;
    line-height: 1.4;
  }
  .card-title {
    text-align: center;
    font-size: 12pt;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin-bottom: 2pt;
  }
  .card-subtitle {
    text-align: center;
    font-size: 10pt;
    margin-bottom: 14pt;
  }

  /* ── Блок сотрудника ── */
  .employee-grid {
    display: table;
    width: 100%;
    margin-bottom: 10pt;
  }
  .emp-col {
    display: table-cell;
    vertical-align: top;
    padding-right: 12pt;
  }
  .emp-col:last-child { padding-right: 0; }

  .field-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 4pt;
    gap: 3px;
  }
  .field-label {
    white-space: nowrap;
    font-size: 9pt;
  }
  .field-value {
    border-bottom: 1px solid #000;
    flex: 1;
    font-weight: bold;
    font-size: 9pt;
    padding: 0 2px;
    min-width: 40px;
  }

  /* ── Таблицы ── */
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 8.5pt;
  }
  th, td {
    border: 1px solid #000;
    padding: 3px 4px;
    vertical-align: middle;
  }
  th {
    font-weight: bold;
    text-align: center;
    font-style: italic;
    background: #fff;
  }
  .col-num {
    text-align: center;
    font-weight: normal;
    font-style: normal;
    padding: 2px;
  }

  /* ── Нормы ── */
  .norms-title {
    font-size: 9pt;
    margin-bottom: 4pt;
  }
  .norms-section { margin-bottom: 10pt; }

  /* ── Подписи ── */
  .signatures {
    margin-top: 10pt;
    margin-bottom: 14pt;
    font-size: 8.5pt;
    width: 100%;
    border-collapse: collapse;
  }
  .sig-label {
    width: 62%;
    padding: 3pt 0;
    vertical-align: bottom;
    border: none;
  }
  .sig-cell {
    width: 38%;
    padding: 3pt 0 3pt 10pt;
    vertical-align: bottom;
    border: none;
  }
  .sig-line {
    border-bottom: 1px solid #000;
    display: block;
    width: 140px;
  }
  /* ── Компактная таблица норм (−30% высоты) ── */
  .norms-section table th,
  .norms-section table td {
    padding: 1px 3px;
    font-size: 7.5pt;
    line-height: 1.2;
  }

  /* ── Таблица выдачи ── */
  .inventory-section {
    page-break-before: always;
    padding-top: 15mm;
  }
  .issued-title {
    font-size: 9pt;
    font-weight: bold;
    margin-bottom: 4pt;
    margin-top: 4pt;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- Шапка первой страницы -->
<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6pt;">
  <div class="org-name" style="margin-bottom:0;">ОАО &ldquo;Брестский ликёро-водочный завод &ldquo;Белалко&rdquo;</div>
  <div style="font-size:9pt; white-space:nowrap; padding-left:12pt;">${exportDate}</div>
</div>

<!-- Заголовок -->
<div class="card-title">ЛИЧНАЯ КАРТОЧКА №&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
<div class="card-subtitle">учета средств индивидуальной защиты</div>

<!-- Данные сотрудника -->
<div class="employee-grid">
  <div class="emp-col" style="width:58%">
    <div class="field-row">
      <span class="field-label">Фамилия</span>
      <span class="field-value">${employee.lastName}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Собственное имя</span>
      <span class="field-value">${employee.firstName}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Отчество</span>
      <span class="field-value">${employee.surName || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Табельный номер</span>
      <span class="field-value">${employee.employeeNumber || ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Профессия (должность)</span>
      <span class="field-value">${employee.profession}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Дата приема на работу</span>
      <span class="field-value"></span>
    </div>
  </div>
  <div class="emp-col" style="width:42%">
    <div class="field-row">
      <span class="field-label">Рост</span>
      <span class="field-value">${employee.height ?? ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Размер одежды</span>
      <span class="field-value">${employee.clothingSize ?? ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Размер обуви</span>
      <span class="field-value">${employee.shoeSize ?? ''}</span>
    </div>
    <div class="field-row">
      <span class="field-label">головного убора</span>
      <span class="field-value"></span>
    </div>
    <div class="field-row">
      <span class="field-label">рукавиц</span>
      <span class="field-value"></span>
    </div>
    <div class="field-row">
      <span class="field-label">перчаток</span>
      <span class="field-value"></span>
    </div>
  </div>
</div>

<!-- Нормы СИЗ -->
${sizNorms.length > 0 ? `
<div class="norms-section">
  <div class="norms-title">Предусмотрено по установленным нормам:</div>
  <table>
    <thead>
      <tr>
        <th style="width:42%">Наименование средства индивидуальной защиты (СИЗ)</th>
        <th style="width:40%">Классификация (маркировка) средства индивидуальной защиты<br>по защитным свойствам или конструктивным особенностям</th>
        <th style="width:9%">Норма выдачи (кол-во)</th>
        <th style="width:9%">Срок</th>
      </tr>
      <tr>
        <td class="col-num">1</td>
        <td class="col-num">2</td>
        <td class="col-num">3</td>
        <td class="col-num">4</td>
      </tr>
    </thead>
    <tbody>
      ${normsRows}
    </tbody>
  </table>
</div>` : ''}

<!-- Подписи -->
<table class="signatures">
  <tr>
    <td class="sig-label">Главный бухгалтер (бухгалтер)</td>
    <td class="sig-cell"><span class="sig-line"></span></td>
  </tr>
  <tr>
    <td class="sig-label" colspan="2">Согласовано:</td>
  </tr>
  <tr>
    <td class="sig-label">специалист отдела кадров</td>
    <td class="sig-cell"><span class="sig-line"></span></td>
  </tr>
  <tr>
    <td class="sig-label">руководитель структурного подразделения</td>
    <td class="sig-cell"><span class="sig-line"></span></td>
  </tr>
  <tr>
    <td class="sig-label">специалист по охране труда</td>
    <td class="sig-cell"><span class="sig-line"></span></td>
  </tr>
  <tr>
    <td class="sig-label">лицо, ответственное за выдачу средств индивидуальной защиты</td>
    <td class="sig-cell"><span class="sig-line"></span></td>
  </tr>
  <tr>
    <td class="sig-label">Ознакомлен: работник</td>
    <td class="sig-cell"><span class="sig-line"></span></td>
  </tr>
</table>

<!-- Таблица выдачи/возврата -->
<div class="inventory-section">
<div class="issued-title">Выданный инвентарь:</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:19%">Наименование средств<br>индивидуальной защиты</th>
      <th colspan="5" style="font-style:normal">Выдано</th>
      <th colspan="5" style="font-style:normal">Возвращено</th>
    </tr>
    <tr>
      <th style="width:8%">Дата<br>выдачи</th>
      <th style="width:5%">коли&shy;чество</th>
      <th style="width:7%">% износа<br>на дату<br>выдачи</th>
      <th style="width:8%">стои&shy;мость,<br>руб.</th>
      <th style="width:12%">Номер и дата<br>документа БУ<br>о получении СИЗ</th>
      <th style="width:8%">Дата<br>возврата</th>
      <th style="width:5%">коли&shy;чество</th>
      <th style="width:7%">% износа</th>
      <th style="width:8%">стои&shy;мость,<br>руб.</th>
      <th style="width:13%">Номер и дата<br>документа БУ<br>о сдаче СИЗ</th>
    </tr>
    <tr>
      <td class="col-num">1</td>
      <td class="col-num">2</td>
      <td class="col-num">3</td>
      <td class="col-num">4</td>
      <td class="col-num">5</td>
      <td class="col-num">6</td>
      <td class="col-num">7</td>
      <td class="col-num">8</td>
      <td class="col-num">9</td>
      <td class="col-num">10</td>
      <td class="col-num">11</td>
    </tr>
  </thead>
  <tbody>
    ${inventoryRows}
  </tbody>
</table>
</div>

</body>
</html>`;
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
                title="Экспорт личной карточки СИЗ"
                open={isModalVisible}
                onOk={handleExport}
                onCancel={() => setIsModalVisible(false)}
                okText="Экспортировать"
                cancelText="Отмена"
            >
                <div style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 10 }}>Выберите формат:</p>
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
                        ? 'Карточка откроется в новом окне — используйте Ctrl+P для сохранения в PDF'
                        : 'Excel-файл (.xlsx) будет скачан автоматически'}
                </div>
            </Modal>
        </>
    );
};

export default ExportCard;
