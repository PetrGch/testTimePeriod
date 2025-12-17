'use client';

import React, { useState, useEffect } from 'react';
import { Modal, DatePicker, Select, Button, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { TimePeriod, INCEPTION_DATE, CUR_DATE, checkOverlap } from '@/utils/timePeriodUtils';

const { Option } = Select;

interface TimePeriodModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  existingPeriods: TimePeriod[];
  editingPeriod?: TimePeriod;
  editingIndex?: number;
  onCancel: () => void;
  onSubmit: (period: TimePeriod) => void;
  onOverlapConfirm: (period: TimePeriod) => void;
}

export default function TimePeriodModal({
  open,
  mode,
  existingPeriods,
  editingPeriod,
  editingIndex,
  onCancel,
  onSubmit,
  onOverlapConfirm,
}: TimePeriodModalProps) {
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDateValue, setToDateValue] = useState<string>('CUR_DATE');
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [pendingPeriod, setPendingPeriod] = useState<TimePeriod | null>(null);

  // Get all unique ToDates from existing periods for dropdown
  const getToDateOptions = (): string[] => {
    const options = ['CUR_DATE'];
    const toDates = existingPeriods
      .map(p => p.toDate)
      .filter(toDate => toDate !== CUR_DATE && toDate !== INCEPTION_DATE)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Add unique ToDates
    const uniqueToDates = Array.from(new Set(toDates));
    options.push(...uniqueToDates);
    
    return options;
  };

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editingPeriod) {
        setFromDate(dayjs(editingPeriod.fromDate));
        setToDateValue(editingPeriod.toDate === CUR_DATE ? 'CUR_DATE' : editingPeriod.toDate);
      } else {
        setFromDate(null);
        setToDateValue('CUR_DATE');
      }
      setShowOverlapWarning(false);
      setPendingPeriod(null);
    }
  }, [open, mode, editingPeriod]);

  const handleSubmit = () => {
    if (!fromDate) return;

    const fromDateStr = fromDate.format('YYYY-MM-DD');
    const toDateStr = toDateValue === 'CUR_DATE' ? CUR_DATE : toDateValue;

    const newPeriod: TimePeriod = {
      fromDate: fromDateStr,
      toDate: toDateStr,
    };

    // Check for overlap
    const periodsToCheck = mode === 'edit' 
      ? existingPeriods.filter((_, idx) => idx !== editingIndex)
      : existingPeriods;

    if (checkOverlap(newPeriod, periodsToCheck)) {
      setPendingPeriod(newPeriod);
      setShowOverlapWarning(true);
    } else {
      onSubmit(newPeriod);
    }
  };

  const handleOverlapConfirm = () => {
    if (pendingPeriod) {
      onOverlapConfirm(pendingPeriod);
      setShowOverlapWarning(false);
      setPendingPeriod(null);
    }
  };

  const handleOverlapCancel = () => {
    setShowOverlapWarning(false);
    setPendingPeriod(null);
  };

  const toDateOptions = getToDateOptions();
  const today = dayjs();
  
  // Determine max date for FromDate picker
  // If ToDate is "Cur Date", can only select dates prior to today
  // If ToDate is a specific date, can select up to that date (but not including, since FromDate must be before ToDate)
  const getMaxFromDate = (): Dayjs | null => {
    if (toDateValue === 'CUR_DATE') {
      return today.subtract(1, 'day'); // Can only select dates before today
    }
    const toDate = dayjs(toDateValue);
    return toDate.subtract(1, 'day'); // FromDate must be at least 1 day before ToDate
  };

  const maxFromDate = getMaxFromDate();

  return (
    <>
      <Modal
        title={mode === 'add' ? 'Add New Time Period' : 'Edit Time Period'}
        open={open && !showOverlapWarning}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} disabled={!fromDate}>
            Submit
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>From Date:</label>
            <DatePicker
              style={{ width: '100%' }}
              value={fromDate}
              onChange={setFromDate}
              disabledDate={(current) => {
                if (!current) return false;
                // Can't select dates after maxFromDate
                if (maxFromDate && current > maxFromDate) {
                  return true;
                }
                return false;
              }}
              format="YYYY-MM-DD"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>To Date:</label>
            <Select
              style={{ width: '100%' }}
              value={toDateValue}
              onChange={setToDateValue}
            >
              {toDateOptions.map(option => (
                <Option key={option} value={option}>
                  {option === 'CUR_DATE' ? 'Cur Date' : dayjs(option).format('MM/DD/YYYY')}
                </Option>
              ))}
            </Select>
          </div>
        </Space>
      </Modal>

      <Modal
        title="Overlap Warning"
        open={showOverlapWarning}
        onOk={handleOverlapConfirm}
        onCancel={handleOverlapCancel}
        okText="Yes, Proceed"
        cancelText="Cancel"
      >
        <p>
          This time period will overlap with existing time period(s) and will be merged.
          Do you want to proceed?
        </p>
      </Modal>
    </>
  );
}

