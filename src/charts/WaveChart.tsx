import React, {useMemo} from 'react';
import CanvasJSReact from '../canvasjs/canvasjs.react';
import {DataPoint} from '../canvasjs/types';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const ONE_SECOND = 1;

interface WaveChartProps {
  title: string;
  buffer: Float32Array;
  sampleRate: number;
}

export const WaveChart: React.FC<WaveChartProps> = React.memo(({title, buffer, sampleRate}) => {
  const options = useMemo(
    () => ({
      zoomEnabled: true,
      animationEnabled: true,
      title: {
        text: title,
      },
      axisX: {
        title: 't, s',
      },
      axisY: {
        title: 's(t)',
        minimum: -1,
        maximum: 1,
      },
      data: [
        {
          type: 'line',
          dataPoints: buildChartData({buffer, sampleRate}),
        },
      ],
    }),
    [title, buffer, sampleRate],
  );

  return <CanvasJSChart options={options} />;
});

const buildChartData = ({buffer, sampleRate}: {buffer: Float32Array; sampleRate: number}) => {
  const period = ONE_SECOND / sampleRate;

  return buffer.reduce<DataPoint[]>((acc, currentValue, currentIndex) => {
    acc.push({
      x: currentIndex * period,
      y: currentValue,
    });

    return acc;
  }, []);
};
