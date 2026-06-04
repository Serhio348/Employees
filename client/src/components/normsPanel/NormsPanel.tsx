import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseOutlined } from '@ant-design/icons';
import SizNormsTable from '../sizNormsTable/SizNormsTable';
import { cleanupMobileBlockers, scheduleCleanupMobileBlockers } from '../../utils/cleanupMobileBlockers';
import './NormsPanel.css';

interface NormsPanelProps {
  open: boolean;
  onClose: () => void;
}

const NormsPanel: React.FC<NormsPanelProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    cleanupMobileBlockers();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      scheduleCleanupMobileBlockers();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="norms-panel-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="norms-panel" role="dialog" aria-modal="true" aria-labelledby="norms-panel-title">
        <div className="norms-panel-header">
          <h2 id="norms-panel-title" className="norms-panel-title">
            Нормативы СИЗ
          </h2>
          <button type="button" className="norms-panel-close" onClick={onClose} aria-label="Закрыть">
            <CloseOutlined />
          </button>
        </div>
        <div className="norms-panel-body">
          <SizNormsTable />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NormsPanel;
