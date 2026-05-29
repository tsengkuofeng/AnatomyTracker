/**
 * 3D解剖模型動畫器 - 根據姿勢數據驅動骨骼
 */
class ModelAnimator {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.bones = {};
        this.isLoaded = false;
    }

    /**
     * 加載GLB模型
     */
    async loadModel(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();

            loader.load(
                modelPath,
                (gltf) => {
                    this.model = gltf.scene;
                    this.scene.add(this.model);

                    // 收集骨骼
                    this.model.traverse((node) => {
                        if (node.isBone) {
                            this.bones[node.name] = node;
                        }
                    });

                    this.isLoaded = true;
                    resolve();
                },
                (progress) => {
                    console.log(`模型加載中: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
                },
                (error) => {
                    console.error('模型加載失敗:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * 使用MediaPipe數據驅動骨骼
     */
    animateWithPose(poseLandmarks) {
        if (!this.isLoaded || !poseLandmarks) return;

        // 肩膀和上臂旋轉
        const leftShoulder = poseLandmarks[11];
        const leftElbow = poseLandmarks[13];
        const rightShoulder = poseLandmarks[12];
        const rightElbow = poseLandmarks[14];

        if (leftShoulder && leftElbow) {
            this.rotateBone(this.bones['Armature.LeftShoulder'],
                leftShoulder, leftElbow);
        }

        if (rightShoulder && rightElbow) {
            this.rotateBone(this.bones['Armature.RightShoulder'],
                rightShoulder, rightElbow);
        }
    }

    /**
     * 旋轉骨骼
     */
    rotateBone(bone, startPoint, endPoint) {
        if (!bone || !startPoint || !endPoint) return;

        const direction = new THREE.Vector3(
            endPoint.x - startPoint.x,
            -(endPoint.y - startPoint.y),
            (endPoint.z - startPoint.z) * 0.5
        ).normalize();

        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
        const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(direction))));

        if (axis.length() > 0) {
            bone.quaternion.setFromAxisAngle(axis, angle);
        }
    }
}