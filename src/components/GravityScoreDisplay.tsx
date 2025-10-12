import React from 'react';
import { useTable } from 'tinybase/ui-react';
import { getCoordinateStore, USER_ACTIONS_TABLE, COORDINATES_TABLE } from '../stores/CoordinateIndexStore';

const store = getCoordinateStore();

const GravityScoreDisplay: React.FC = () => {
  const userActions = useTable(USER_ACTIONS_TABLE, store);
  const coordinates = useTable(COORDINATES_TABLE, store);

  if (!userActions || Object.keys(userActions).length === 0) {
    return <div></div>;
  }

  const counts: { [coordinate: number]: number } = {};
  Object.values(userActions).forEach((row: any) => {
    counts[row.coordinate] = (counts[row.coordinate] || 0) + 1;
  });

  const topScore = Math.max(0, ...Object.values(counts));
  const topCoordinate = Object.keys(counts).find(key => counts[Number(key)] === topScore);

  let topAsin = 'N/A';
  if (topCoordinate && coordinates) {
  // Only consider keys that look like real ASINs (B0XXXXXXX pattern)
const validAsins = Object.keys(coordinates).filter(
  id => typeof id === 'string' && id.startsWith('B0') && !id.includes('-')
);

const foundAsin = validAsins.find(
  asin => (coordinates[asin] as any).coordinate === Number(topCoordinate)
);

if (foundAsin) {
  topAsin = foundAsin;

  // ✅ Save the valid ASIN so TelegramMiniApp can read it
  if (topAsin.startsWith("B0")) {
    localStorage.setItem("topAsin", topAsin);
  }
} else {
  console.warn("⚠️ Top coordinate belongs to a non-ASIN entry (likely dealId)");
}

  }

  return (
    <div style={{ textAlign: 'center', padding: '0.5rem', color: 'transparent', fontSize: '0.9rem' }}>
    </div>
  );
};

export default GravityScoreDisplay;
