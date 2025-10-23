import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee } from '@prisma/client';

interface HeaderContextType {
    isHeaderHidden: boolean;
    hideHeader: () => void;
    showHeader: () => void;
    employeeInfo: Employee | null;
    setEmployeeInfo: (employee: Employee | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
};

interface HeaderProviderProps {
    children: ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const [employeeInfo, setEmployeeInfo] = useState<Employee | null>(null);

    const hideHeader = () => setIsHeaderHidden(true);
    const showHeader = () => {
        setIsHeaderHidden(false);
        setEmployeeInfo(null);
    };

    return (
        <HeaderContext.Provider value={{
            isHeaderHidden,
            hideHeader,
            showHeader,
            employeeInfo,
            setEmployeeInfo
        }}>
            {children}
        </HeaderContext.Provider>
    );
};
