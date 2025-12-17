'use client';

import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { TimePeriod, INCEPTION_DATE, CUR_DATE } from '@/utils/timePeriodUtils';
import { Button, Space } from 'antd';
import dayjs from 'dayjs';

interface TimePeriodTableProps {
  periods: TimePeriod[];
  onEdit: (index: number, period: TimePeriod) => void;
  onDelete: (index: number) => void;
  canEdit: (index: number) => boolean;
  canDelete: (index: number) => boolean;
}

export default function TimePeriodTable({
  periods,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: TimePeriodTableProps) {
  const formatDate = (date: string): string => {
    if (date === INCEPTION_DATE) return 'Inception Date';
    if (date === CUR_DATE) return 'Cur Date';
    return dayjs(date).format('MM/DD/YYYY');
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'From Date',
      field: 'fromDate',
      flex: 1,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      headerName: 'To Date',
      field: 'toDate',
      flex: 1,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      cellRenderer: (params: any) => {
        const index = params.node.rowIndex;
        const period = periods[index];
        
        return (
          <Space>
            <Button
              size="small"
              type="link"
              onClick={() => onEdit(index, period)}
              disabled={!canEdit(index)}
            >
              Edit
            </Button>
            <Button
              size="small"
              type="link"
              danger
              onClick={() => onDelete(index)}
              disabled={!canDelete(index)}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        rowData={periods}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
        }}
      />
    </div>
  );
}

