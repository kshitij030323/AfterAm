import * as FileSystem from 'expo-file-system/legacy';

const VIDEO_CACHE_DIR = `${FileSystem.cacheDirectory}video-cache/`;

// Track pending downloads to avoid duplicates
const pendingDownloads = new Map<string, Promise<string>>();

// Ensure cache directory exists
const ensureCacheDir = async () => {
    const info = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(VIDEO_CACHE_DIR, { intermediates: true });
    }
};

// Generate a cache key from URL
const getCacheKey = (url: string): string => {
    // Create a simple hash from URL
    const hash = url.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const extension = url.split('.').pop()?.split('?')[0] || 'mp4';
    return `video_${Math.abs(hash).toString(16)}.${extension}`;
};

// Get cached video path
const getCachedPath = (url: string): string => {
    return VIDEO_CACHE_DIR + getCacheKey(url);
};

/**
 * Get a cached video URL. Returns local path if cached, otherwise original URL.
 * Starts background caching if not cached.
 */
export const getCachedVideoUrl = async (url: string): Promise<string> => {
    if (!url) return url;

    try {
        await ensureCacheDir();
        const cachedPath = getCachedPath(url);
        const info = await FileSystem.getInfoAsync(cachedPath);

        if (info.exists) {
            // Video is cached, return local path
            console.log('Video cache hit:', url);
            return cachedPath;
        }

        // Video not cached - start download in background
        console.log('Video cache miss, starting background download:', url);
        cacheVideoInBackground(url, cachedPath);
        return url;
    } catch (error) {
        console.warn('Video cache error:', error);
        return url;
    }
};

/**
 * Pre-cache a video URL - blocks until download completes
 */
export const preCacheVideo = async (url: string): Promise<void> => {
    if (!url) return;

    try {
        await ensureCacheDir();
        const cachedPath = getCachedPath(url);
        const info = await FileSystem.getInfoAsync(cachedPath);

        if (!info.exists) {
            // Check if already downloading
            if (pendingDownloads.has(url)) {
                await pendingDownloads.get(url);
            } else {
                await downloadVideo(url, cachedPath);
            }
        }
    } catch (error) {
        console.warn('Pre-cache video error:', error);
    }
};

/**
 * Check if a video is cached
 */
export const isVideoCached = async (url: string): Promise<boolean> => {
    if (!url) return false;

    try {
        const cachedPath = getCachedPath(url);
        const info = await FileSystem.getInfoAsync(cachedPath);
        return info.exists;
    } catch {
        return false;
    }
};

// Download video to cache
const downloadVideo = async (url: string, cachedPath: string): Promise<string> => {
    // Create promise for tracking
    const downloadPromise = (async () => {
        try {
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                cachedPath,
                {},
                (progress) => {
                    // Optional: track progress
                    const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite * 100;
                    console.log(`Video download progress: ${percent.toFixed(1)}%`);
                }
            );

            const result = await downloadResumable.downloadAsync();
            if (!result?.uri) {
                throw new Error('Download failed');
            }
            console.log('Video cached successfully:', cachedPath);
            return result.uri;
        } catch (error) {
            // Clean up failed download
            try {
                await FileSystem.deleteAsync(cachedPath, { idempotent: true });
            } catch { }
            throw error;
        } finally {
            pendingDownloads.delete(url);
        }
    })();

    pendingDownloads.set(url, downloadPromise);
    return downloadPromise;
};

// Cache video in background (fire and forget)
const cacheVideoInBackground = (url: string, cachedPath: string) => {
    // Check if already downloading
    if (pendingDownloads.has(url)) {
        return;
    }

    downloadVideo(url, cachedPath).catch((error) => {
        console.warn('Background video cache failed:', error);
    });
};

/**
 * Clear video cache
 */
export const clearVideoCache = async (): Promise<void> => {
    try {
        const info = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR);
        if (info.exists) {
            await FileSystem.deleteAsync(VIDEO_CACHE_DIR, { idempotent: true });
        }
    } catch (error) {
        console.warn('Clear video cache error:', error);
    }
};

/**
 * Get cache size in bytes
 */
export const getVideoCacheSize = async (): Promise<number> => {
    try {
        const info = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR);
        if (!info.exists) return 0;

        const files = await FileSystem.readDirectoryAsync(VIDEO_CACHE_DIR);
        let totalSize = 0;

        for (const file of files) {
            const fileInfo = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR + file);
            if (fileInfo.exists && 'size' in fileInfo) {
                totalSize += fileInfo.size || 0;
            }
        }

        return totalSize;
    } catch {
        return 0;
    }
};
