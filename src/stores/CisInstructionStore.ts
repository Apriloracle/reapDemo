import { createStore, Store } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

const store = createStore();
const persister = typeof window !== 'undefined'
  ? createLocalPersister(store, 'cis-instruction-store')
  : null;

export const CIS_INSTRUCTIONS_TABLE = 'cisInstructions';

export const upsertCisInstruction = (instruction: any) => {
  store.setRow(CIS_INSTRUCTIONS_TABLE, instruction.id, instruction.data);
};

export const getCisInstructionStore = (): Store => store;

export const initializeCisInstructionStore = async () => {
  if (persister) {
    await persister.load();
    persister.startAutoSave();
    console.log('CisInstructionStore initialized from persister.');
  }
};
