/**
 * Centralized Resource Manager for managing, caching, and safely disposing 
 * HTMLImageElement and HTMLVideoElement instances.
 * Prevents memory leaks, unreleased Blob object URLs, and visualizer lag.
 */

class MediaResourceManager {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private activeBlobUrls: Set<string> = new Set();
  private maxCacheSize: number = 20;

  /**
   * Register a newly created Blob Object URL so it can be tracked and revoked.
   */
  public registerBlobUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      this.activeBlobUrls.add(url);
    }
  }

  /**
   * Safely load or retrieve an HTMLImageElement by URL.
   */
  public loadImage(url: string | null): Promise<HTMLImageElement | null> {
    if (!url) return Promise.resolve(null);

    // Return cached image if available
    if (this.imageCache.has(url)) {
      const cached = this.imageCache.get(url)!;
      if (cached.complete && cached.naturalWidth > 0) {
        return Promise.resolve(cached);
      }
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        this.cacheImage(url, img);
        resolve(img);
      };

      img.onerror = () => {
        // Fallback without crossOrigin header for hosts that don't support CORS preflight
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          this.cacheImage(url, fallbackImg);
          resolve(fallbackImg);
        };
        fallbackImg.onerror = (err) => {
          console.warn(`[ResourceManager] Failed to load image: ${url}`, err);
          resolve(null);
        };
        if (url.startsWith('blob:')) {
          this.registerBlobUrl(url);
        }
        fallbackImg.src = url;
      };

      if (url.startsWith('blob:')) {
        this.registerBlobUrl(url);
      }

      img.src = url;
    });
  }

  /**
   * Synchronously obtain an HTMLImageElement if cached, or kick off loading.
   */
  public getOrLoadImage(url: string | null, onLoad?: (img: HTMLImageElement) => void): HTMLImageElement | null {
    if (!url) return null;

    if (this.imageCache.has(url)) {
      const cached = this.imageCache.get(url)!;
      if (cached.complete && cached.naturalWidth > 0) {
        if (onLoad) onLoad(cached);
        return cached;
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.cacheImage(url, img);
      if (onLoad) onLoad(img);
    };
    img.onerror = () => {
      // Fallback without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        this.cacheImage(url, fallbackImg);
        if (onLoad) onLoad(fallbackImg);
      };
      fallbackImg.onerror = () => {
        console.warn(`[ResourceManager] Failed to load image: ${url}`);
      };
      if (url.startsWith('blob:')) {
        this.registerBlobUrl(url);
      }
      fallbackImg.src = url;
    };

    if (url.startsWith('blob:')) {
      this.registerBlobUrl(url);
    }

    img.src = url;
    return img;
  }

  /**
   * Safely create or retrieve an HTMLVideoElement.
   */
  public loadVideo(
    url: string | null,
    options: { loop?: boolean; muted?: boolean; playsInline?: boolean } = {}
  ): Promise<HTMLVideoElement | null> {
    if (!url) return Promise.resolve(null);

    if (this.videoCache.has(url)) {
      const cached = this.videoCache.get(url)!;
      return Promise.resolve(cached);
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.loop = options.loop !== undefined ? options.loop : true;
      video.muted = options.muted !== undefined ? options.muted : true;
      video.playsInline = options.playsInline !== undefined ? options.playsInline : true;

      if (url.startsWith('blob:')) {
        this.registerBlobUrl(url);
      }

      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        this.cacheVideo(url, video);
        video.play().catch(() => {});
        resolve(video);
      };

      const onError = (e: Event) => {
        video.removeEventListener('error', onError);
        console.warn(`[ResourceManager] Failed to load video: ${url}`, e);
        resolve(null);
      };

      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);
      video.src = url;
      video.load();
    });
  }

  /**
   * Cache image with capacity management
   */
  private cacheImage(url: string, img: HTMLImageElement): void {
    if (this.imageCache.size >= this.maxCacheSize) {
      // Evict oldest entry
      const oldestKey = this.imageCache.keys().next().value;
      if (oldestKey) {
        this.disposeImageByKey(oldestKey);
      }
    }
    this.imageCache.set(url, img);
  }

  /**
   * Cache video with capacity management
   */
  private cacheVideo(url: string, video: HTMLVideoElement): void {
    if (this.videoCache.size >= this.maxCacheSize) {
      const oldestKey = this.videoCache.keys().next().value;
      if (oldestKey) {
        this.disposeVideoByKey(oldestKey);
      }
    }
    this.videoCache.set(url, video);
  }

  /**
   * Safely dispose a single HTMLVideoElement.
   */
  public disposeVideo(video: HTMLVideoElement | null): void {
    if (!video) return;

    try {
      video.pause();
      const currentSrc = video.src;
      video.removeAttribute('src');
      video.load();

      if (currentSrc && this.videoCache.has(currentSrc)) {
        this.videoCache.delete(currentSrc);
      }

      if (currentSrc && currentSrc.startsWith('blob:') && this.activeBlobUrls.has(currentSrc)) {
        URL.revokeObjectURL(currentSrc);
        this.activeBlobUrls.delete(currentSrc);
      }
    } catch (e) {
      console.warn('[ResourceManager] Error disposing video:', e);
    }
  }

  /**
   * Safely dispose a video by URL key.
   */
  private disposeVideoByKey(url: string): void {
    const video = this.videoCache.get(url);
    if (video) {
      this.disposeVideo(video);
      this.videoCache.delete(url);
    }
  }

  /**
   * Safely dispose an image by URL key.
   */
  private disposeImageByKey(url: string): void {
    const img = this.imageCache.get(url);
    if (img) {
      img.onload = null;
      img.onerror = null;
      img.src = '';
      this.imageCache.delete(url);

      if (url.startsWith('blob:') && this.activeBlobUrls.has(url)) {
        URL.revokeObjectURL(url);
        this.activeBlobUrls.delete(url);
      }
    }
  }

  /**
   * Purge unused blob URLs that are no longer active, keeping HTTP assets cached up to max capacity.
   * Prevents audio/video stuttering and memory leaks during preset switches.
   */
  public purgeUnused(activeUrls: Set<string>): void {
    // Collect unreferenced blob URLs to safely revoke without mutating during iteration
    const blobUrlsToRevoke: string[] = [];
    for (const blobUrl of Array.from(this.activeBlobUrls)) {
      if (!activeUrls.has(blobUrl)) {
        blobUrlsToRevoke.push(blobUrl);
      }
    }

    for (const blobUrl of blobUrlsToRevoke) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
      this.activeBlobUrls.delete(blobUrl);
      this.imageCache.delete(blobUrl);
      this.videoCache.delete(blobUrl);
    }
  }

  /**
   * Full cleanup on unmount or reset.
   */
  public clearAll(): void {
    for (const [url] of this.imageCache.entries()) {
      this.disposeImageByKey(url);
    }
    for (const [url] of this.videoCache.entries()) {
      this.disposeVideoByKey(url);
    }
    for (const blobUrl of Array.from(this.activeBlobUrls)) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    }
    this.imageCache.clear();
    this.videoCache.clear();
    this.activeBlobUrls.clear();
  }
}

export const resourceManager = new MediaResourceManager();
