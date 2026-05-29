/**
 * MediaPipe姿勢檢測器
 */
class PoseDetector {
    constructor(onResultsCallback) {
        this.pose = null;
        this.camera = null;
        this.isInitialized = false;
        this.onResults = onResultsCallback;
        this.isRunning = false;
    }

    /**
     * 初始化MediaPipe Pose
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            const pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            pose.onResults((results) => {
                if (this.onResults) {
                    this.onResults(results);
                }
            });

            this.pose = pose;
            this.isInitialized = true;
            resolve();
        });
    }

    /**
     * 開啟攝像頭並開始檢測
     */
    async startCamera() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const video = document.getElementById('video');

        if (!video) {
            console.error('找不到video元素');
            return;
        }

        this.camera = new Camera(video, {
            onFrame: async () => {
                await this.pose.send({ image: video });
            },
            width: 320,
            height: 240
        });

        this.camera.start();
        this.isRunning = true;
    }

    /**
     * 停止攝像頭
     */
    stopCamera() {
        if (this.camera) {
            this.camera.stop();
            this.isRunning = false;
        }
    }

    /**
     * 檢查是否正在運行
     */
    getIsRunning() {
        return this.isRunning;
    }
}