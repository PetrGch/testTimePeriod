# Time Period Selection Prototype

A React/TypeScript prototype for managing time periods with AG Grid and Ant Design.

## Features

- **Time Period Management**: Add, edit, and delete time periods
- **Overlap Detection**: Warns users when new periods overlap existing ones
- **Automatic Merging**: Automatically merges overlapping periods
- **Contiguous Periods**: Ensures all periods are contiguous (no gaps)
- **Boundary Dates**: Uses "Inception Date" (1111-11-11) and "Cur Date" (9999-12-31) as boundaries

## Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **AG Grid** - Data grid component
- **Ant Design** - UI component library
- **Day.js** - Date manipulation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── page.tsx          # Main page component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── TimePeriodTable.tsx   # AG Grid table component
│   └── TimePeriodModal.tsx   # Add/Edit modal component
└── utils/
    └── timePeriodUtils.ts    # Core utility functions
```

## Core Utility Functions

The `timePeriodUtils.ts` file contains the core logic that can be extracted and reused:

- `checkOverlap()` - Checks if a new period overlaps with existing periods
- `calculateTimePeriods()` - Calculates resulting periods after add/edit/delete operations

## Usage Scenarios

### Adding a New Period
1. Click "Add New Time Period"
2. Select From Date (date picker)
3. Select To Date (dropdown with existing ToDates + "Cur Date")
4. Submit - if overlap detected, warning modal appears

### Editing a Period
1. Click "Edit" on a time period row
2. Modify From Date and/or To Date
3. Submit - periods will be merged/split as needed

### Deleting a Period
1. Click "Delete" on a time period row
2. Adjacent periods will be automatically merged

## Notes

- Periods must be contiguous (FromDate of one = ToDate of previous + 1 day)
- When only one period exists, Edit/Delete actions are disabled
- "Cur Date" and "Inception Date" are labels for boundary dates (9999-12-31 and 1111-11-11)

