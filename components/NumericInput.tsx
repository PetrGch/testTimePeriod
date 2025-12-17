'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';

interface NumericInputProps {
  value?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export default function NumericInput({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1.00,
  placeholder,
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatValue(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Format: hide .00 for whole numbers, show decimals otherwise
  const formatValue = (val: number): string => {
    if (Math.abs(val % 1) < 0.0001) {
      return Math.round(val).toString();
    }
    return val.toFixed(2).replace(/\.?0+$/, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    if (inputValue === '' || inputValue === '.') {
      onChange?.(null);
      return;
    }

    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clampedValue = Math.max(min, Math.min(max, parsed));
      onChange?.(clampedValue);
      
      if (clampedValue !== parsed) {
        setDisplayValue(formatValue(clampedValue));
      }
    }
  };

  const handleInputBlur = () => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatValue(value));
    } else {
      setDisplayValue('');
    }
  };

  const handleIncrement = () => {
    const currentValue = value ?? min;
    const newValue = Math.min(max, currentValue + step);
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const currentValue = value ?? min;
    const newValue = Math.max(min, currentValue - step);
    onChange?.(newValue);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '4px 11px',
          fontSize: '14px',
          lineHeight: '1.5715',
          color: 'rgba(0, 0, 0, 0.88)',
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Button
          icon={<UpOutlined />}
          onClick={handleIncrement}
          disabled={value !== undefined && value !== null && value >= max}
          size="small"
          style={{ height: '20px', padding: '0 8px' }}
        />
        <Button
          icon={<DownOutlined />}
          onClick={handleDecrement}
          disabled={value !== undefined && value !== null && value <= min}
          size="small"
          style={{ height: '20px', padding: '0 8px' }}
        />
      </div>
    </div>
  );
}

