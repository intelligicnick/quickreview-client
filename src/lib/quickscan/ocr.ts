import { createWorker, OEM, PSM, type Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng+hin', OEM.LSTM_ONLY);
      return worker;
    })();
  }
  return workerPromise;
}

export type OcrProgress = { progress: number; status: string };

export type OcrResult = {
  text: string;
  meanConfidence: number;
};

export async function recognizeCardBlob(
  blob: Blob,
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrResult> {
  const worker = await getWorker();
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  });
  const { data } = await worker.recognize(blob);
  onProgress?.({ progress: 1, status: 'Done' });

  const text = (data.text ?? '').trim();
  const meanConfidence =
    typeof data.confidence === 'number' && !Number.isNaN(data.confidence) ? data.confidence : 0;

  return { text, meanConfidence };
}

export async function recognizeMultipleBlobs(
  blobs: Blob[],
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrResult> {
  const parts: string[] = [];
  let confSum = 0;
  for (let i = 0; i < blobs.length; i++) {
    onProgress?.({
      progress: i / blobs.length,
      status: blobs.length > 1 ? `Reading side ${i + 1} of ${blobs.length}…` : 'Reading card…',
    });
    const result = await recognizeCardBlob(blobs[i]!, (inner) => {
      onProgress?.({
        progress: (i + inner.progress) / blobs.length,
        status: inner.status,
      });
    });
    if (result.text) parts.push(result.text);
    confSum += result.meanConfidence;
  }
  return {
    text: parts.join('\n\n---\n\n'),
    meanConfidence: blobs.length ? confSum / blobs.length : 0,
  };
}

export function ocrConfidenceBand(mean: number): 'low' | 'medium' | 'high' {
  if (mean >= 75) return 'high';
  if (mean >= 45) return 'medium';
  return 'low';
}
