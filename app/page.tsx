'use client';

import React, { useState } from 'react';
import { Button, Space } from 'antd';
import TimePeriodTable from '@/components/TimePeriodTable';
import TimePeriodModal from '@/components/TimePeriodModal';
import NumericInput from '@/components/NumericInput';
import {
  TimePeriod,
  INCEPTION_DATE,
  CUR_DATE,
  checkOverlap,
  calculateTimePeriods,
  hasMoreThanDefaultPeriod,
} from '@/utils/timePeriodUtils';

export default function Home() {
  const [periods, setPeriods] = useState<TimePeriod[]>([
    {
      fromDate: INCEPTION_DATE,
      toDate: CUR_DATE,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingPeriod, setEditingPeriod] = useState<TimePeriod | undefined>();
  const [numericValue, setNumericValue] = useState<number | null>(null);

  const handleAddNew = () => {
    setModalMode('add');
    setEditingIndex(-1);
    setEditingPeriod(undefined);
    setModalOpen(true);
  };

  const handleEdit = (index: number, period: TimePeriod) => {
    setModalMode('edit');
    setEditingIndex(index);
    setEditingPeriod(period);
    setModalOpen(true);
  };

  const handleDelete = (index: number) => {
    if (periods.length <= 1) return; // Can't delete last period
    
    const newPeriods = calculateTimePeriods('delete', { deleteIndex: index }, periods);
    setPeriods(newPeriods);
  };

  const handleModalSubmit = (newPeriod: TimePeriod) => {
    if (modalMode === 'add') {
      const newPeriods = calculateTimePeriods('add', { newPeriod }, periods);
      setPeriods(newPeriods);
    } else {
      const newPeriods = calculateTimePeriods('edit', {
        editIndex: editingIndex,
        newPeriod,
      }, periods);
      setPeriods(newPeriods);
    }
    setModalOpen(false);
  };

  const handleOverlapConfirm = (newPeriod: TimePeriod) => {
    // User confirmed overlap, proceed with calculation
    if (modalMode === 'add') {
      const newPeriods = calculateTimePeriods('add', { newPeriod }, periods);
      setPeriods(newPeriods);
    } else {
      const newPeriods = calculateTimePeriods('edit', {
        editIndex: editingIndex,
        newPeriod,
      }, periods);
      setPeriods(newPeriods);
    }
    setModalOpen(false);
  };

  const canEdit = (index: number): boolean => {
    return hasMoreThanDefaultPeriod(periods);
  };

  const canDelete = (index: number): boolean => {
    return hasMoreThanDefaultPeriod(periods);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Time Period Management</h1>
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Button type="primary" onClick={handleAddNew}>
          Add New Time Period
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ marginRight: '8px' }}>Numeric Input:</label>
          <NumericInput
            value={numericValue ?? undefined}
            onChange={setNumericValue}
            min={1}
            max={100}
            step={1.00}
            placeholder="Enter value (1-100)"
          />
        </div>
      </div>

      <TimePeriodTable
        periods={periods}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <TimePeriodModal
        open={modalOpen}
        mode={modalMode}
        existingPeriods={periods}
        editingPeriod={editingPeriod}
        editingIndex={editingIndex}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        onOverlapConfirm={handleOverlapConfirm}
      />
    </div>
  );
}

