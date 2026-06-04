import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cleanupMobileBlockers } from '../../utils/cleanupMobileBlockers';

const RouteCleanup = () => {
  const location = useLocation();

  useEffect(() => {
    cleanupMobileBlockers();
  }, [location.pathname, location.search]);

  return <Outlet />;
};

export default RouteCleanup;
