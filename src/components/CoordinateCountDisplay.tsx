import React from 'react';
import { useMetric } from 'tinybase/ui-react';
import { getCoordinateMetrics } from '../stores/CoordinateIndexStore';

const metrics = getCoordinateMetrics();

const CoordinateCountDisplay: React.FC = () => {
  const coordinateCount = useMetric('coordinateCount', metrics);
  const coordinateCapacity = useMetric('coordinateCapacity', metrics);
  const coordinateIncrease = useMetric('coordinateIncrease', metrics) as number ?? 0;

  const getIncreaseColor = () => {
    if (coordinateIncrease > 10) return 'red';
    if (coordinateIncrease > 5) return 'yellow';
    return 'green';
  };

 return (
    <div style={{ position: 'fixed', top: '0px', right: '0px', backgroundColor: 'rgba(0,0,0,0.0)', color: 'transparent', padding: '5px', borderRadius: '5px', zIndex: 9999 }}>
      <p>{typeof coordinateCapacity === 'number' ? coordinateCapacity.toFixed(2) : 'N/A'}%</p>
    </div>
  );
};

export default CoordinateCountDisplay;
