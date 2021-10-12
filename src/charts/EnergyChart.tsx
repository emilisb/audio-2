import React, {useMemo} from 'react';
import CanvasJSReact from '../canvasjs/canvasjs.react';
import {AxisStripLine, DataPoint} from '../canvasjs/types';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const ONE_SECOND = 1;
const ONE_SECOND_IN_MS = 1000;

interface EnergyChartProps {
  title: string;
  buffer: Float32Array;
  sampleRate: number;
  frameLengthMs: number;
  silenceThreshold: number;
}

export const EnergyChart: React.FC<EnergyChartProps> = React.memo(
  ({title, buffer, sampleRate, frameLengthMs, silenceThreshold}) => {
    const options = useMemo(() => {
      const energyData = buildEnergyData({buffer, sampleRate, frameLengthMs});
      return {
        zoomEnabled: true,
        animationEnabled: true,
        title: {
          text: title,
        },
        axisX: {
          title: 't, s',
          stripLines: buildSoundLines(energyData, silenceThreshold),
        },
        axisY: {
          title: 'Energija',
          stripLines: [
            {
              value: silenceThreshold,
              showOnTop: true,
              color: 'green',
              label: 'Garso slenkstinė riba',
            },
          ],
        },
        data: [
          {
            type: 'line',
            dataPoints: energyData,
          },
        ],
      };
    }, [title, buffer, sampleRate, frameLengthMs, silenceThreshold]);

    return <CanvasJSChart options={options} />;
  },
);

const buildSoundLines = (energy: DataPoint[], threshold: number): AxisStripLine[] => {
  const lines: AxisStripLine[] = [];

  let silence = true;
  let soundStartIndex = 0;

  energy
    .map((dataPoint) => dataPoint.y)
    .forEach((energyValue, index) => {
      const isLastItem = energy.length - 1 === index;

      if (silence && energyValue > threshold) {
        silence = false;
        soundStartIndex = index;
      } else if (!silence && (energyValue < threshold || isLastItem)) {
        silence = true;

        lines.push({
          startValue: soundStartIndex,
          endValue: index,
          opacity: 0.1,
          color: 'green',
        });
      }
    });

  return lines;
};

const buildEnergyData = ({
  buffer,
  sampleRate,
  frameLengthMs,
}: {
  buffer: Float32Array;
  sampleRate: number;
  frameLengthMs: number;
}): DataPoint[] => {
  const period = ONE_SECOND / sampleRate;
  const periodMs = period * ONE_SECOND_IN_MS;

  const frameLengthInSignals = Math.ceil(frameLengthMs / periodMs);

  const energyData: DataPoint[] = [];

  for (
    let startCursor = 0, frame = 0;
    startCursor < buffer.length;
    frame++, startCursor += Math.ceil(frameLengthInSignals / 2)
  ) {
    const frameData = buffer.slice(startCursor, startCursor + frameLengthInSignals);
    const energy = calculateEnergy(frameData);

    energyData.push({x: startCursor * period, y: energy});
  }

  return energyData;
};

const calculateEnergy = (frameData: Float32Array): number => {
  const signalPowerOfTwo = frameData.map((value) => Math.pow(value, 2));
  const sumAllPowerOfTwo = signalPowerOfTwo.reduce((partialSum, item) => partialSum + item, 0);
  return (1 / frameData.length) * sumAllPowerOfTwo;
};
