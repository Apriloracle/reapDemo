import { Store } from 'tinybase';
import { getCoordinateForData } from './probeUtils';

/**
 * Enhances a TinyBase store by adding a 'coordinate' column to a specified table.
 * It also provides a function to calculate and update these coordinates.
 * @param store The TinyBase store instance.
 * @param tableName The name of the table to add the coordinate column to.
 * @returns An async function that, when called, updates the coordinates for all rows in the table.
 */
export function addCoordinateToStore(store: Store, tableName: string) {
  /**
   * Updates the 'coordinate' cell for all rows in the specified table.
   * This function will add the 'coordinate' cell if it doesn't exist.
   */
  return async function updateCoordinates() {
    const rows = store.getTable(tableName);
    for (const rowId in rows) {
      const rowData = rows[rowId];
      const coordinate = await getCoordinateForData(rowData);
      store.setCell(tableName, rowId, 'coordinate', coordinate);
    }
  };
}
