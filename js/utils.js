// 工具函數

/**
 * 從MediaPipe姿勢數據獲取特定的關鍵點
 */
const POSE_LANDMARKS = {
    // 上半身
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,

    // 肩膀
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,

    // 手臂
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,

    // 手指
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,

    // 軀幹
    LEFT_HIP: 23,
    RIGHT_HIP: 24,

    // 腿
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,

    // 腳
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32
};

/**
 * 將MediaPipe坐標轉換為Three.js世界坐標
 */
function mediapipeToThreeJS(pose, videoWidth, videoHeight, scale = 5) {
    if (!pose || !pose.landmarks) return null;

    const result = {};
    pose.landmarks.forEach((landmark, index) => {
        result[index] = new THREE.Vector3(
            (landmark.x - 0.5) * scale,
            -(landmark.y - 0.5) * scale,
            -landmark.z * scale * 0.5
        );
    });

    return result;
}

/**
 * 計算兩點之間的距離
 */
function distance(p1, p2) {
    if (!p1 || !p2) return 0;
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
    );
}

/**
 * 計算三點之間的角度 (p1-p0-p2)
 */
function calculateAngle(p1, p0, p2) {
    const v1 = {
        x: p1.x - p0.x,
        y: p1.y - p0.y,
        z: p1.z - p0.z
    };

    const v2 = {
        x: p2.x - p0.x,
        y: p2.y - p0.y,
        z: p2.z - p0.z
    };

    const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

    if (mag1 === 0 || mag2 === 0) return 0;

    return Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));
}

/**
 * 平滑pose數據（降低抖動）
 */
class PoseSmoother {
    constructor(smoothingFactor = 0.7) {
        this.smoothingFactor = smoothingFactor;
        this.previousPose = null;
    }

    smooth(pose) {
        if (!this.previousPose) {
            this.previousPose = JSON.parse(JSON.stringify(pose));
            return pose;
        }

        if (pose.landmarks) {
            pose.landmarks.forEach((landmark, index) => {
                landmark.x = landmark.x * (1 - this.smoothingFactor) +
                             this.previousPose.landmarks[index].x * this.smoothingFactor;
                landmark.y = landmark.y * (1 - this.smoothingFactor) +
                             this.previousPose.landmarks[index].y * this.smoothingFactor;
                landmark.z = landmark.z * (1 - this.smoothingFactor) +
                             this.previousPose.landmarks[index].z * this.smoothingFactor;
            });
        }

        this.previousPose = JSON.parse(JSON.stringify(pose));
        return pose;
    }
}

/**
 * FPS計數器
 */
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        return this.fps;
    }
}