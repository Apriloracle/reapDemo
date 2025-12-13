import { getCoordinateForData } from './probeUtils';
import { upsertCisInstruction, getCisInstructionStore } from '../stores/CisInstructionStore';
import cisInstructions from '../data/reap-cis-list.json';

interface CisData {
  description: string;
  type: string;
  tags: string[];
}

export const populateCisInstructionStore = async () => {
  const store = getCisInstructionStore();
  if (store.getRowCount('cisInstructions') > 0) {
    console.log('CisInstructionStore already populated.');
    return;
  }

  for (const [cisInstruction, data] of Object.entries(cisInstructions) as [string, CisData][]) {
    const instructionCoordinate = await getCoordinateForData(cisInstruction);
    const typeCoordinate = await getCoordinateForData(data.type);
    try {
      const tagCoordinates = await Promise.all(
        data.tags.map((tag) => getCoordinateForData(tag))
      );

      upsertCisInstruction({
        id: cisInstruction,
        data: {
          ...data,
          instructionCoordinate,
          typeCoordinate,
          tagCoordinates,
        },
      });
    } catch (error) {
      console.error('Error processing tags for:', cisInstruction, error);
    }
  }
};
