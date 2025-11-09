import { registerTool } from './mcp-engine';
import { getStore } from '../stores'; // This will be our centralized store registry

export function registerTinybaseTools(storeName) {
  const store = getStore(storeName).getStore();

  registerTool(`getRows_${storeName}`, () => {
    const tableIds = store.getTableIds();
    const result = {};
    for (const tableId of tableIds) {
      result[tableId] = store.getTable(tableId);
    }
    return result;
  });

  registerTool(`getRow_${storeName}`, ({ tableId, rowId }) => {
    return store.getRow(tableId, rowId);
  });

  registerTool(`setRow_${storeName}`, ({ tableId, rowId, values }) => {
    store.setRow(tableId, rowId, values);
    return { ok: true };
  });

  registerTool(`deleteRow_${storeName}`, ({ tableId, rowId }) => {
    store.delRow(tableId, rowId);
    return { ok: true };
  });
}
