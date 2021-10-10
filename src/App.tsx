import {useState, useMemo, useCallback, ChangeEvent} from 'react';
import './App.css';
import {EnergyChart} from './charts/EnergyChart';
import {WaveChart} from './charts/WaveChart';
import {ZeroCrossingRateChart} from './charts/ZeroCrossingRateChart';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const {files} = event.target;
    if (files?.length) {
      const [file] = files;

      setSelectedFile(file);
      setAudioBuffer(null);

      loadFile(file);
    }
  }, []);

  const loadFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const decodedData = await audioContext.decodeAudioData(buffer);

    setAudioBuffer(decodedData);
  };

  const channelBuffers = useMemo(() => {
    if (!audioBuffer) {
      return [];
    }

    const buffers = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      buffers[i] = audioBuffer.getChannelData(i);
    }

    return buffers;
  }, [audioBuffer]);

  return (
    <div className="App">
      <h1>Garso signalų atvaizdavimas</h1>
      <div>
        <input type="file" onChange={onFileChange} />
      </div>
      <div>
        {selectedFile ? <h3>Failo "{selectedFile.name}" analizė</h3> : null}
        {audioBuffer ? (
          <div>
            <p>
              Trukmė - {audioBuffer.duration.toFixed(2)}s (signalo ilgis - {audioBuffer.length})
            </p>
            <p>Dažnis - {audioBuffer.sampleRate}Hz</p>
            <p>Kanalų kiekis - {audioBuffer.numberOfChannels}</p>
            {channelBuffers.map((buffer, index) => (
              <WaveChart
                key={index}
                title={`Amplitudė: kanalas ${index}`}
                buffer={buffer}
                sampleRate={audioBuffer.sampleRate}
              />
            ))}
            {channelBuffers.map((buffer, index) => (
              <EnergyChart
                key={index}
                title={`Energija: kanalas ${index}`}
                buffer={buffer}
                sampleRate={audioBuffer.sampleRate}
                frameLengthMs={20}
                silenceThreshold={0.01}
              />
            ))}
            {channelBuffers.map((buffer, index) => (
              <ZeroCrossingRateChart
                key={index}
                title={`NKS: kanalas ${index}`}
                buffer={buffer}
                sampleRate={audioBuffer.sampleRate}
                frameLengthMs={20}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
