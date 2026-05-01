import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result;
        resolve(String(result).split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

export const saveBlobFile = async (blob, filename, mimeType) => {
    if (Capacitor.isNativePlatform()) {
        const base64Data = await blobToBase64(blob);
        const result = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
        });

        await Share.share({
            title: filename,
            text: `Saved ${filename}`,
            url: result.uri,
            dialogTitle: 'Open or share file'
        });

        return filename;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.type = mimeType;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return filename;
};

export const shareBlobFile = async (blob, filename, mimeType, title, text) => {
    if (Capacitor.isNativePlatform()) {
        const base64Data = await blobToBase64(blob);
        const result = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
        });

        await Share.share({
            title,
            text,
            url: result.uri,
            dialogTitle: 'Share file'
        });

        return filename;
    }

    const file =
        typeof File !== 'undefined' ? new File([blob], filename, { type: mimeType }) : null;

    if (
        file &&
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
    ) {
        await navigator.share({
            files: [file],
            title,
            text
        });
        return filename;
    }

    throw new Error('File sharing is not supported on this device');
};
