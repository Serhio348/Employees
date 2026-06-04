import React, { useEffect, useRef } from 'react';
import './MobileActionsMenu.css';

interface MobileActionsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

const MobileActionsMenu: React.FC<MobileActionsMenuProps> = ({
  open,
  onOpenChange,
  trigger,
  children,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, onOpenChange]);

  return (
    <div className="mobile-actions-menu" ref={rootRef}>
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <>
          <div
            className="mobile-actions-menu-backdrop"
            role="presentation"
            onClick={() => onOpenChange(false)}
          />
          <div className="mobile-actions-menu-panel">{children}</div>
        </>
      )}
    </div>
  );
};

export default MobileActionsMenu;
