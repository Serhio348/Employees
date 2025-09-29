import { useState, useEffect } from 'react';

export interface SizNorm {
    id: string;
    name: string;
    classification: string;
    quantity: number;
    period: string;
    periodType: 'months' | 'until_worn';
}

// Стандартные нормативы СИЗ
const defaultSizNorms: SizNorm[] = [
    {
        id: '1',
        name: 'Жилет утепленный',
        classification: 'Тн',
        quantity: 1,
        period: '24',
        periodType: 'months'
    },
    {
        id: '2',
        name: 'Костюм х/б',
        classification: 'ЗМи',
        quantity: 1,
        period: '12',
        periodType: 'months'
    },
    {
        id: '3',
        name: 'Ботинки',
        classification: 'Ми',
        quantity: 1,
        period: '12',
        periodType: 'months'
    },
    {
        id: '4',
        name: 'Сапоги резиновые',
        classification: 'В',
        quantity: 1,
        period: '24',
        periodType: 'months'
    },
    {
        id: '5',
        name: 'Каска защитная',
        classification: '',
        quantity: 1,
        period: 'д/и',
        periodType: 'until_worn'
    },
    {
        id: '6',
        name: 'Фуфайка с логотипом',
        classification: 'ЗМи',
        quantity: 2,
        period: '6',
        periodType: 'months'
    },
    {
        id: '7',
        name: 'Куртка утеплённая',
        classification: 'Тн',
        quantity: 1,
        period: '36',
        periodType: 'months'
    },
    {
        id: '8',
        name: 'Брюки утепленные',
        classification: 'Тн',
        quantity: 1,
        period: '36',
        periodType: 'months'
    },
    {
        id: '9',
        name: 'Перчатки зимние',
        classification: 'Тн',
        quantity: 1,
        period: 'д/и',
        periodType: 'until_worn'
    },
    {
        id: '10',
        name: 'Ботинки утепленные',
        classification: 'Тн',
        quantity: 1,
        period: '24',
        periodType: 'months'
    },
    {
        id: '11',
        name: 'Кепка',
        classification: '',
        quantity: 1,
        period: '12',
        periodType: 'months'
    },
    {
        id: '12',
        name: 'Очки защитные',
        classification: 'ЗП',
        quantity: 1,
        period: 'д/и',
        periodType: 'until_worn'
    },
    {
        id: '13',
        name: 'Шапка трикотажная',
        classification: '',
        quantity: 1,
        period: '24',
        periodType: 'months'
    },
    {
        id: '14',
        name: 'Перчатки х/б с ПВХ',
        classification: 'Ми',
        quantity: 1,
        period: 'д/и',
        periodType: 'until_worn'
    },
    {
        id: '15',
        name: 'Перчатки резиновые',
        classification: 'Вн',
        quantity: 2,
        period: 'д/и',
        periodType: 'until_worn'
    },
    {
        id: '16',
        name: 'Плащ влагостойкий',
        classification: 'Вн',
        quantity: 3,
        period: 'д/и',
        periodType: 'until_worn'
    },
    {
        id: '17',
        name: 'Пояс предохранительный пп-а фал',
        classification: 'Вн',
        quantity: 4,
        period: 'д/и',
        periodType: 'until_worn'
    }
];

export const useSizNorms = () => {
    const [sizNorms, setSizNorms] = useState<SizNorm[]>(defaultSizNorms);

    // Загружаем нормативы из localStorage при инициализации
    useEffect(() => {
        const savedNorms = localStorage.getItem('sizNorms');
        if (savedNorms) {
            try {
                setSizNorms(JSON.parse(savedNorms));
            } catch (error) {
                console.error('Error loading SIZ norms from localStorage:', error);
            }
        }
    }, []);

    // Сохраняем нормативы в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('sizNorms', JSON.stringify(sizNorms));
    }, [sizNorms]);

    const updateSizNorms = (newNorms: SizNorm[]) => {
        setSizNorms(newNorms);
    };

    return {
        sizNorms,
        updateSizNorms
    };
};
