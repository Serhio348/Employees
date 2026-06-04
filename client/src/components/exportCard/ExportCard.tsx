import React, { useMemo, useState } from 'react';
import { Button, Checkbox, Modal, Space, message } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { FilePdfOutlined } from '@ant-design/icons';
import { Employee } from '@prisma/client';
import { InventoryItem } from '../../app/services/inventory';
import { SizNorm } from '../../app/services/sizNorms';

interface Props {
    employee: Employee;
    inventory: InventoryItem[];
    sizNorms: SizNorm[];
    onOpen?: () => void;
    showTrigger?: boolean;
    exportModalOpen?: boolean;
    onExportModalOpenChange?: (open: boolean) => void;
}

type InventoryType = 'спецодежда' | 'сиз' | 'инструмент' | 'оборудование';

const EXPORT_TYPE_OPTIONS: Array<{ label: string; value: InventoryType }> = [
    { label: 'Спецодежда', value: 'спецодежда' },
    { label: 'СИЗ', value: 'сиз' },
    { label: 'Инвентарь / инструмент', value: 'инструмент' },
    { label: 'Оборудование', value: 'оборудование' },
];

const ExportCard = ({
    employee,
    inventory,
    sizNorms,
    onOpen,
    showTrigger = true,
    exportModalOpen,
    onExportModalOpenChange,
}: Props) => {
    const [internalExportModalOpen, setInternalExportModalOpen] = useState(false);
    const isExportModalOpen = exportModalOpen ?? internalExportModalOpen;
    const setExportModalOpen = onExportModalOpenChange ?? setInternalExportModalOpen;
    const [selectedTypes, setSelectedTypes] = useState<InventoryType[]>(
        EXPORT_TYPE_OPTIONS.map(option => option.value)
    );

    const availableTypeOptions = useMemo(() => {
        const activeTypes = new Set(
            inventory
                .filter(item => item.status !== 'списан')
                .map(item => item.itemType)
        );

        const visibleOptions = EXPORT_TYPE_OPTIONS.filter(option => activeTypes.has(option.value));
        return visibleOptions.length > 0 ? visibleOptions : EXPORT_TYPE_OPTIONS;
    }, [inventory]);

    const normalizeName = (value: string = '') => value
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^a-zа-я0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    const findNormForItem = (item: InventoryItem, norms: SizNorm[]) => {
        if (item.sizNormId) {
            const normById = norms.find(n => n.id === item.sizNormId);
            if (normById) return normById;
        }

        const itemName = normalizeName(item.itemName);
        return norms.find(n => {
            const normName = normalizeName(n.name);
            return normName === itemName
                || itemName.includes(normName)
                || normName.includes(itemName);
        });
    };

    // Расчёт % износа по нормам СИЗ
    const calculateWearPercentage = (item: InventoryItem, norms: SizNorm[]): number => {
        if (!item.issueDate) return 0;

        const norm = findNormForItem(item, norms);

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

    const generateHTMLContent = () => {
        const activeItems = inventory.filter(i =>
            i.status !== 'списан' && selectedTypes.includes(i.itemType as InventoryType)
        );
        const matchedNormIds = new Set(
            activeItems
                .map(item => findNormForItem(item, sizNorms)?.id)
                .filter(Boolean)
        );
        const filteredNorms = sizNorms.filter(norm => norm.id && matchedNormIds.has(norm.id));

        const normsRows = filteredNorms.map(norm => `
            <tr>
                <td>${norm.name}</td>
                <td style="text-align:center">${norm.classification || ''}</td>
                <td style="text-align:center">${norm.quantity ?? 1}</td>
                <td style="text-align:center">${normPeriodLabel(norm)}</td>
            </tr>`).join('');

        const inventoryRows = activeItems.map(item => {
            const wear = calculateWearPercentage(item, sizNorms);
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
${filteredNorms.length > 0 ? `
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
            {showTrigger && (
                <Button
                    type="primary"
                    icon={<FilePdfOutlined />}
                    onClick={() => {
                        onOpen?.();
                        setExportModalOpen(true);
                    }}
                >
                    Экспорт карточки
                </Button>
            )}

            <Modal
                title="Экспорт карточки"
                open={isExportModalOpen}
                onCancel={() => setExportModalOpen(false)}
                okText="Экспортировать"
                cancelText="Отмена"
                onOk={() => {
                    if (selectedTypes.length === 0) {
                        message.warning('Выберите хотя бы один вид СИЗ');
                        return;
                    }

                    setExportModalOpen(false);
                    exportToPDF();
                }}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        Выберите виды, которые нужно включить в карточку:
                    </div>
                    <Checkbox.Group
                        value={selectedTypes}
                        onChange={(values: CheckboxValueType[]) => {
                            setSelectedTypes(values as InventoryType[]);
                        }}
                    >
                        <Space direction="vertical">
                            {availableTypeOptions.map(option => (
                                <Checkbox key={option.value} value={option.value}>
                                    {option.label}
                                </Checkbox>
                            ))}
                        </Space>
                    </Checkbox.Group>
                </Space>
            </Modal>
        </>
    );
};

export default ExportCard;
