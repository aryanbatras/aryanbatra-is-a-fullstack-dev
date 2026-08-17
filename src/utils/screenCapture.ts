/**
 * Screen capture (daedalOS "Capture screen" from the desktop context menu).
 * Records the screen with getDisplayMedia + MediaRecorder and resolves a
 * webm Blob when the user stops sharing. The caller saves it as a file.
 */

let recorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;

export const isCapturing = () => recorder?.state === "recording";

export interface ScreenCapture {
  /** Resolves with the recorded webm once the user stops the capture. */
  finished: Promise<Blob>;
  /** Stop the capture early (same as the user ending the share). */
  stop: () => void;
}

export async function startScreenCapture(): Promise<ScreenCapture | null> {
  if (recorder?.state === "recording") return null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      surfaceSwitching: "include",
      systemAudio: "include",
    } as DisplayMediaStreamOptions);

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";
    const chunks: Blob[] = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const finished = new Promise<Blob>((resolve) => {
      if (!recorder) return;
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mime || "video/webm" }));
        stream?.getTracks().forEach((t) => t.stop());
        recorder = null;
        stream = null;
      };
    });

    recorder.start();
    return {
      finished,
      stop: () => recorder?.stop(),
    };
  } catch {
    // user cancelled the share picker
    return null;
  }
}

export function stopScreenCapture() {
  recorder?.stop();
}

/** Read a Blob as a data: URL (for the Finder file system). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
