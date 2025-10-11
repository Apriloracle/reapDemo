import { Store } from 'tinybase';
import { upsertCoordinate } from '@/stores/CoordinateIndexStore';

/**
 * Iterates over a given store's table, reads the 'coordinate' value from each row,
 * and upserts it into the central CoordinateIndexStore.
 * @param store The TinyBase store instance to read from.
 * @param tableName The name of the table to iterate over.
 */
export function populateCoordinateIndex(store: Store, tableName: string) {
  const rows = store.getTable(tableName);
  for (const rowId in rows) {
    const rowData = rows[rowId];
    if (rowData.coordinate) {
      upsertCoordinate({
        id: rowId,
        type: tableName,
        coordinate: rowData.coordinate as number,
      });
    }
  }
}
