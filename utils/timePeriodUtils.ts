export const INCEPTION_DATE = '1111-11-11';
export const CUR_DATE = '9999-12-31';

export type TimePeriod = {
  fromDate: string; // ISO date string (YYYY-MM-DD)
  toDate: string;   // ISO date string (YYYY-MM-DD)
};

/**
 * Helper function to format date string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if we only have the default "Inception Date - Cur Date" period
 * @param periods - Array of time periods
 * @returns true if only default period exists, false otherwise
 */
export function isDefaultPeriodOnly(periods: TimePeriod[]): boolean {
  if (periods.length !== 1) {
    return false;
  }
  
  const period = periods[0];
  return period.fromDate === INCEPTION_DATE && period.toDate === CUR_DATE;
}

/**
 * Check if we have more than just the default period
 * This can be used to determine if actions (edit/delete) should be enabled
 * @param periods - Array of time periods
 * @returns true if we have more than default period, false otherwise
 */
export function hasMoreThanDefaultPeriod(periods: TimePeriod[]): boolean {
  return !isDefaultPeriodOnly(periods);
}

/**
 * Check if a new time period overlaps with any existing time periods
 * @param newPeriod - The new time period to check
 * @param existingPeriods - Array of existing time periods
 * @returns true if there's an overlap, false otherwise
 */
export function checkOverlap(
  newPeriod: TimePeriod,
  existingPeriods: TimePeriod[]
): boolean {
  // If we only have the default period, no need to check overlap (first time adding is OK)
  if (isDefaultPeriodOnly(existingPeriods)) {
    return false;
  }
  
  const { fromDate, toDate } = newPeriod;
  const newFrom = new Date(fromDate);
  const newTo = new Date(toDate);
  
  return existingPeriods.some(period => {
    const existingFrom = new Date(period.fromDate);
    const existingTo = new Date(period.toDate);
    
    // Overlap occurs if periods intersect (accounting for 1-day gap requirement)
    // Two periods overlap if: newFrom <= existingTo+1 AND newTo >= existingFrom
    const existingToPlusGap = addDays(existingTo, 1);
    
    return newFrom <= existingToPlusGap && newTo >= existingFrom;
  });
}

/**
 * Calculate the resulting time periods after adding a new period
 * Handles splitting, merging, and insertion logic
 */
export function calculateTimePeriods(
  operation: 'add' | 'edit' | 'delete',
  params: {
    newPeriod?: TimePeriod;
    editIndex?: number;
    deleteIndex?: number;
  },
  existingPeriods: TimePeriod[]
): TimePeriod[] {
  if (operation === 'delete') {
    return handleDelete(params.deleteIndex!, existingPeriods);
  }
  
  if (operation === 'edit') {
    return handleEdit(params.editIndex!, params.newPeriod!, existingPeriods);
  }
  
  // operation === 'add'
  return handleAdd(params.newPeriod!, existingPeriods);
}

/**
 * Handle adding a new time period
 * Handles splitting, merging, and insertion
 */
function handleAdd(
  newPeriod: TimePeriod,
  existingPeriods: TimePeriod[]
): TimePeriod[] {
  if (existingPeriods.length === 0) {
    return [newPeriod];
  }
  
  const { fromDate, toDate } = newPeriod;
  const newFrom = new Date(fromDate);
  const newTo = new Date(toDate);
  
  // Sort periods by fromDate
  const sorted = [...existingPeriods].sort((a, b) => 
    new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
  );
  
  // Find where to insert/merge the new period
  const findInsertionPoint = (): { index: number; action: 'insert' | 'merge' | 'split' | 'append' } => {
    const beforeIndex = sorted.findIndex(period => {
      const periodFrom = new Date(period.fromDate);
      return newFrom < periodFrom;
    });
    
    if (beforeIndex === -1) {
      // New period should be at the end
      return { index: sorted.length, action: 'append' };
    }
    
    const beforePeriod = sorted[beforeIndex];
    const beforeFrom = new Date(beforePeriod.fromDate);
    const beforeTo = new Date(beforePeriod.toDate);
    const gapDate = addDays(beforeFrom, -1);
    
    if (newTo < gapDate) {
      // Insert before this period (no overlap)
      return { index: beforeIndex, action: 'insert' };
    }
    
    // Check if new period starts within an existing period
    const withinIndex = sorted.findIndex(period => {
      const periodFrom = new Date(period.fromDate);
      const periodTo = new Date(period.toDate);
      return newFrom >= periodFrom && newFrom <= periodTo;
    });
    
    if (withinIndex !== -1) {
      const withinPeriod = sorted[withinIndex];
      const withinTo = new Date(withinPeriod.toDate);
      
      if (newTo < withinTo) {
        // Split the period
        return { index: withinIndex, action: 'split' };
      } else {
        // Merge (extends beyond)
        return { index: withinIndex, action: 'merge' };
      }
    }
    
    // Overlaps with beforeIndex period
    return { index: beforeIndex, action: 'merge' };
  };
  
  const insertion = findInsertionPoint();
  
  if (insertion.action === 'append') {
    return ensureContiguous([...sorted, newPeriod]);
  }
  
  if (insertion.action === 'insert') {
    const result = [...sorted];
    result.splice(insertion.index, 0, newPeriod);
    return ensureContiguous(result);
  }
  
  if (insertion.action === 'split') {
    const period = sorted[insertion.index];
    const periodFrom = new Date(period.fromDate);
    const periodTo = new Date(period.toDate);
    
    const beforeGap = addDays(newFrom, -1);
    const afterStart = addDays(newTo, 1);
    
    const parts: TimePeriod[] = [];
    
    // Before part
    parts.push({
      fromDate: period.fromDate,
      toDate: formatDate(beforeGap)
    });
    
    // New period
    parts.push(newPeriod);
    
    // After part (if exists)
    if (afterStart <= periodTo) {
      parts.push({
        fromDate: formatDate(afterStart),
        toDate: period.toDate
      });
    }
    
    const result = [
      ...sorted.slice(0, insertion.index),
      ...parts,
      ...sorted.slice(insertion.index + 1)
    ];
    
    return ensureContiguous(result);
  }
  
  // Merge action
  const startIndex = insertion.index;
  const remainingPeriods = sorted.slice(startIndex);
  const overlappingPeriods = remainingPeriods.filter((period, idx) => {
    if (idx === 0) return true; // Always include the first one
    const periodFrom = new Date(period.fromDate);
    return newTo >= addDays(periodFrom, -1);
  });
  
  const allPeriodsToMerge = [newPeriod, ...overlappingPeriods];
  const allFromDates = allPeriodsToMerge.map(p => new Date(p.fromDate).getTime());
  const allToDates = allPeriodsToMerge.map(p => new Date(p.toDate).getTime());
  
  const mergedFrom = new Date(Math.min(...allFromDates));
  const mergedToTime = Math.max(...allToDates);
  const mergedToPeriod = allPeriodsToMerge.find(p => new Date(p.toDate).getTime() === mergedToTime);
  
  const merged: TimePeriod = {
    fromDate: formatDate(mergedFrom),
    toDate: mergedToPeriod?.toDate || toDate
  };
  
  const result = [
    ...sorted.slice(0, startIndex),
    merged,
    ...sorted.slice(startIndex + overlappingPeriods.length)
  ];
  
  return ensureContiguous(result);
}

/**
 * Handle editing an existing time period
 */
function handleEdit(
  editIndex: number,
  newPeriod: TimePeriod,
  existingPeriods: TimePeriod[]
): TimePeriod[] {
  if (existingPeriods.length === 0) {
    return [newPeriod];
  }
  
  // Remove the period being edited
  const withoutEdited = existingPeriods.filter((_, idx) => idx !== editIndex);
  
  // Add the new period (which will handle merging/splitting)
  const result = handleAdd(newPeriod, withoutEdited);
  
  // Ensure contiguity (handle gaps that might have been created)
  return ensureContiguous(result);
}

/**
 * Handle deleting a time period
 * Merges adjacent periods to maintain contiguity
 */
function handleDelete(
  deleteIndex: number,
  existingPeriods: TimePeriod[]
): TimePeriod[] {
  if (existingPeriods.length <= 1) {
    return existingPeriods; // Can't delete the last period
  }
  
  // Sort periods by fromDate
  const sorted = [...existingPeriods].sort((a, b) => 
    new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
  );
  
  const deletedPeriod = existingPeriods[deleteIndex];
  
  // Find the index in sorted array
  const deletedSortedIndex = sorted.findIndex(
    period => period.fromDate === deletedPeriod.fromDate && 
               period.toDate === deletedPeriod.toDate
  );
  
  if (deletedSortedIndex === -1) {
    return existingPeriods; // Period not found
  }
  
  // If deleting first period, merge with next
  if (deletedSortedIndex === 0) {
    if (sorted.length > 1) {
      const result = [sorted[1], ...sorted.slice(2)];
      return ensureContiguous(result);
    }
  }
  
  // If deleting last period, merge with previous
  if (deletedSortedIndex === sorted.length - 1) {
    const beforeDeleted = sorted.slice(0, -1);
    const lastPeriod = beforeDeleted[beforeDeleted.length - 1];
    
    const result = [
      ...beforeDeleted.slice(0, -1),
      {
        fromDate: lastPeriod.fromDate,
        toDate: deletedPeriod.toDate
      }
    ];
    
    return ensureContiguous(result);
  }
  
  // If deleting middle period, merge previous and next
  const beforeDeleted = sorted.slice(0, deletedSortedIndex);
  const afterDeleted = sorted.slice(deletedSortedIndex + 1);
  const prev = beforeDeleted[beforeDeleted.length - 1];
  const next = afterDeleted[0];
  
  const result = [
    ...beforeDeleted.slice(0, -1),
    {
      fromDate: prev.fromDate,
      toDate: next.toDate
    },
    ...afterDeleted.slice(1)
  ];
  
  return ensureContiguous(result);
}

/**
 * Ensure all periods are contiguous (no gaps)
 * Periods must be touching: FromDate of one = ToDate of previous + 1 day
 */
function ensureContiguous(periods: TimePeriod[]): TimePeriod[] {
  if (periods.length <= 1) return periods;
  
  // Sort periods by fromDate
  const sorted = [...periods].sort((a, b) => 
    new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
  );
  
  return sorted.slice(1).reduce((result, current) => {
    const prev = result[result.length - 1];
    const prevTo = new Date(prev.toDate);
    const currentFrom = new Date(current.fromDate);
    const expectedGapDate = addDays(currentFrom, -1);
    
    // Check if there's a gap
    if (formatDate(prevTo) !== formatDate(expectedGapDate)) {
      // Fill the gap by extending previous period's ToDate
      result[result.length - 1] = {
        fromDate: prev.fromDate,
        toDate: formatDate(expectedGapDate)
      };
    }
    
    // Check if current overlaps with previous (after gap fill)
    const updatedPrevTo = new Date(result[result.length - 1].toDate);
    if (currentFrom <= updatedPrevTo) {
      // Merge periods - take the maximum ToDate
      const currentTo = new Date(current.toDate);
      result[result.length - 1] = {
        fromDate: result[result.length - 1].fromDate,
        toDate: currentTo > updatedPrevTo ? current.toDate : result[result.length - 1].toDate
      };
    } else {
      // They're contiguous, add current period
      result.push(current);
    }
    
    return result;
  }, [sorted[0]]);
}

