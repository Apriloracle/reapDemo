import { registerTinybaseTools } from './mcp-tinybase-adapter';
import * as stores from '../stores';

Object.keys(stores).forEach(storeName => {
  if (storeName !== 'getStore') {
    registerTinybaseTools(storeName);
  }
});
