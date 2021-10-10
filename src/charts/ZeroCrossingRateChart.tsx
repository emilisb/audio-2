import React, {useMemo} from 'react';
import CanvasJSReact from '../canvasjs/canvasjs.react';
import {DataPoint} from '../canvasjs/types';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const ONE_SECOND = 1;
const ONE_SECOND_IN_MS = 1000;

interface ZeroCrossingRateChartProps {
  title: string;
  buffer: Float32Array;
  sampleRate: number;
  frameLengthMs: number;
}

export const ZeroCrossingRateChart: React.FC<ZeroCrossingRateChartProps> = React.memo(
  ({title, buffer, sampleRate, frameLengthMs}) => {
    const options = useMemo(
      () => ({
        zoomEnabled: true,
        animationEnabled: true,
        title: {
          text: title,
        },
        axisX: {
          title: 'Kadro nr.',
        },
        axisY: {
          title: 'NKS',
        },
        data: [
          {
            type: 'line',
            dataPoints: buildChartData({buffer, sampleRate, frameLengthMs}),
          },
        ],
      }),
      [title, buffer, sampleRate, frameLengthMs],
    );

    return <CanvasJSChart options={options} />;
  },
);

const buildChartData = ({
  buffer,
  sampleRate,
  frameLengthMs,
}: {
  buffer: Float32Array;
  sampleRate: number;
  frameLengthMs: number;
}) => {
  const period = ONE_SECOND / sampleRate;
  const periodMs = period * ONE_SECOND_IN_MS;

  const frameLengthInSignals = Math.ceil(frameLengthMs / periodMs);

  const chartData: DataPoint[] = [];

  for (
    let startCursor = 0, frame = 0;
    startCursor < buffer.length;
    frame++, startCursor += Math.ceil(frameLengthInSignals / 2)
  ) {
    const frameData = buffer.slice(startCursor, startCursor + frameLengthInSignals);
    const zcr = zeroCrossingRate(frameData);

    chartData.push({x: frame, y: zcr});
  }

  return chartData;
};

const zeroCrossingRate = (frameData: Float32Array): number => {
  const signs = frameData
    .map((_, index, signals) => (index > 0 ? Math.abs(sign(signals[index]) - sign(signals[index - 1])) : 0))
    .slice(1);
  const sumOfSigns = signs.reduce((partialSum, item) => partialSum + item, 0);
  return sumOfSigns / (2 * frameData.length);
};

const sign = (value: number) => {
  if (value < 0) {
    return -1;
  }

  return 1;
};
