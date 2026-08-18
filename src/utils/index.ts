/**
 * Utils — barrel export.
 *
 * Import utilities from here:
 *   import { sounds, addFile, readFiles } from "@/utils";
 */

// Sound system
export { sounds, soundEnabled, setSoundEnabled } from "./sounds";

// Finder file system (localStorage-backed)
export {
  addFile,
  addFolder,
  addDroppedPhoto,
  deleteFile,
  deleteFolder,
  readFiles,
  readFolders,
  renameFile,
  renameFolder,
  moveFileToFolder,
  moveFolderTo,
  copyFileTo,
  copyFolderTo,
  setFolderStyle,
  fileToDataUrl,
  downloadText,
  downloadUrl,
} from "./finderStorage";

// Archive handling
export {
  bytesToDataUrl,
  bytesToStr,
  dataUrlToBytes,
  entryExtension,
  entryKind,
  entryName,
  isTextEntry,
  parseIso,
  strToBytes,
  unzipEntries,
  zipEntries,
} from "./archives";
export { unarchive } from "./unarchive";

// System utilities
export { installClipboardWatcher } from "./clipboardHistory";
export { startScreenCapture, stopScreenCapture, isCapturing, blobToDataUrl } from "./screenCapture";
export { spawnSheep } from "./sheep";
export { getNtpAdjustedTime as ntpTime } from "./ntp";
