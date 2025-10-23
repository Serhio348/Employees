import { useState, useEffect, useMemo } from 'react';
import { BREAKPOINTS } from '../constants/responsive';

export const useResponsive = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = useMemo(() => windowWidth <= BREAKPOINTS.MOBILE, [windowWidth]);
    const isSmallMobile = useMemo(() => windowWidth <= BREAKPOINTS.SMALL_MOBILE, [windowWidth]);
    const isVerySmall = useMemo(() => windowWidth <= BREAKPOINTS.VERY_SMALL, [windowWidth]);

    return {
        windowWidth,
        isMobile,
        isSmallMobile,
        isVerySmall
    };
};
