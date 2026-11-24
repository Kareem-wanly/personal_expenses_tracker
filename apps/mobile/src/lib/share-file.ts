import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/** Writes a file and opens the phone's share sheet (save, send…). */
export async function shareFile(name: string, text: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  try {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
  } finally {
    file.delete();
  }
}
