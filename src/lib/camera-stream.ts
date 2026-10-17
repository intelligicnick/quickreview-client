type LegacyNavigator = Navigator & {
  getUserMedia?: (
    constraints: MediaStreamConstraints,
    ok: (stream: MediaStream) => void,
    err: (error: unknown) => void,
  ) => void;
  webkitGetUserMedia?: (
    constraints: MediaStreamConstraints,
    ok: (stream: MediaStream) => void,
    err: (error: unknown) => void,
  ) => void;
};

export function hasCameraApi(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.mediaDevices?.getUserMedia === 'function') return true;
  const nav = navigator as LegacyNavigator;
  return Boolean(nav.getUserMedia ?? nav.webkitGetUserMedia);
}

function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  const nav = navigator as LegacyNavigator;
  const legacy = nav.getUserMedia ?? nav.webkitGetUserMedia;
  if (!legacy) {
    throw new Error('unsupported');
  }
  return new Promise((resolve, reject) => {
    legacy.call(navigator, constraints, resolve, reject);
  });
}

async function environmentDeviceId(): Promise<string | undefined> {
  if (!navigator.mediaDevices?.enumerateDevices) return undefined;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((d) => d.kind === 'videoinput');
  const back = cameras.find((d) => /back|rear|environment/i.test(d.label));
  if (back?.deviceId) return back.deviceId;
  return cameras.length > 1 ? cameras[cameras.length - 1]?.deviceId : cameras[0]?.deviceId;
}

async function tryOpenCamera(attempts: MediaStreamConstraints[]): Promise<MediaStream> {
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw err;
      }
    }
  }
  throw lastError ?? new Error('camera-unavailable');
}

/** Request rear camera with fallbacks (Android Chrome / PWA). Call synchronously from a user tap. */
export async function requestQrCameraStream(): Promise<MediaStream> {
  if (!hasCameraApi()) {
    throw new Error('unsupported');
  }

  // getUserMedia first — do not await enumerateDevices before the first attempt (breaks Android gesture).
  const primary: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: { facingMode: 'environment' } },
    { audio: false, video: true },
  ];

  try {
    return await tryOpenCamera(primary);
  } catch (firstErr) {
    if (firstErr instanceof DOMException && firstErr.name === 'NotAllowedError') {
      throw firstErr;
    }
  }

  const deviceId = await environmentDeviceId().catch(() => undefined);
  if (deviceId) {
    try {
      return await getUserMedia({ audio: false, video: { deviceId: { exact: deviceId } } });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw err;
      }
    }
  }

  return await tryOpenCamera([{ audio: false, video: true }]);
}

export function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      return 'Camera access was denied. Allow camera in Chrome site settings, then try again.';
    }
    if (err.name === 'NotFoundError') {
      return 'No camera found on this device. Enter the standee code manually.';
    }
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return 'Camera is in use by another app. Close it and try again.';
    }
  }
  if (err instanceof Error) {
    if (err.message === 'unsupported') {
      return 'Camera scan is not supported in this browser. Enter the code manually.';
    }
    if (err.message === 'no video element') {
      return 'Could not show the camera preview. Try “Take photo of QR” below.';
    }
  }
  return 'Could not open the camera. Enter the standee code manually.';
}

export async function attachStreamToVideo(stream: MediaStream, video: HTMLVideoElement): Promise<void> {
  video.srcObject = stream;
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.setAttribute('autoplay', 'true');

  try {
    await video.play();
  } catch (err) {
    if (video.readyState < 2) throw err;
  }
}
