// js/exercises.js

/**
 * 動作配置系統
 * 所有動作定義都在這裡，便於新增和管理
 */

const EXERCISES_CONFIG = {
    // 胸推
    chestPush: {
        id: 'chest-push',
        name: '胸推 (Chest Push)',
        category: 'chest',
        difficulty: 'intermediate',
        icon: '💪',
        thumbnail: 'https://via.placeholder.com/200?text=Chest+Push',
        description: '鍛鍊胸大肌、前三角肌和三頭肌的複合動作',

        // 模型配置
        model: {
            path: 'models/pec.glb',
            parts: {
                muscles: {
                    pectoralisMajorL: 'Sternal_head_of_pectoralis_major_muscle_l',
                    pectoralisMajorR: 'Sternal_head_of_pectoralis_major_muscle_r',
                },
                bones: [
                    'Ribs',
                    'Sternum',
                    'Humerus_l',
                    'Humerus_r',
                    'Radius_l',
                    'Radius_r',
                    'Ulna_l',
                    'Ulna_r',
                    'Clavicle_l',
                    'Clavicle_r',
                    'Scapula_l',
                    'Scapula_r',
                ]
            }
        },

        // MediaPipe 映射
        poseMapping: {
            landmarks: {
                leftShoulder: 11,
                rightShoulder: 12,
                leftElbow: 13,
                rightElbow: 14,
                leftWrist: 15,
                rightWrist: 16,
            }
        },

        // 訓練設定
        training: {
            defaultSets: 4,
            defaultReps: 8,
            defaultRest: 90,
        }
    },
};

// 取得所有動作
function getAllExercises() {
    return Object.values(EXERCISES_CONFIG);
}

// 按 ID 取得動作
function getExerciseById(id) {
    for (let key in EXERCISES_CONFIG) {
        if (EXERCISES_CONFIG[key].id === id) {
            return EXERCISES_CONFIG[key];
        }
    }
    return null;
}

/**
 * 胸推動作映射
 * 根據 MediaPipe 姿勢數據，驅動胸肌 3D 模型
 */

const CHEST_PUSH_MAPPING = {
    // ========== 胸肌膨脹 ==========
    chestExpansion: {
        calculate: function(pose) {
            const lm = EXERCISES_CONFIG.chestPush.poseMapping.landmarks;

            const leftWrist = pose[lm.leftWrist];
            const rightWrist = pose[lm.rightWrist];
            const leftShoulder = pose[lm.leftShoulder];
            const rightShoulder = pose[lm.rightShoulder];

            if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
                return { pushProgress: 0, leftPush: 0, rightPush: 0 };
            }

            // 計算手臂前推的距離 (z軸)
            const leftPushDistance = Math.max(0, leftShoulder.z - leftWrist.z);
            const rightPushDistance = Math.max(0, rightShoulder.z - rightWrist.z);

            // 平均推進距離
            const avgPushDistance = (leftPushDistance + rightPushDistance) / 2;

            // 歸一化到 0-1 (調整係數以獲得更好的響應)
            const pushProgress = Math.max(0, Math.min(1, avgPushDistance * 3));

            return {
                pushProgress: pushProgress,
                leftPush: leftPushDistance,
                rightPush: rightPushDistance,
            };
        },

        apply: function(modelParts, calculationResult) {
            const config = EXERCISES_CONFIG.chestPush;
            const muscleLNames = [
                config.model.parts.muscles.pectoralisMajorL,
                config.model.parts.muscles.pectoralisMajorR
            ];

            const pushProgress = calculationResult.pushProgress;

            // 胸肌膨脹：scale 從 1 到 1.3
            const scale = 1 + pushProgress * 0.3;

            muscleLNames.forEach(name => {
                if (modelParts[name]) {
                    modelParts[name].scale.set(scale, scale, scale);
                }
            });
        }
    },

    // ========== 手臂旋轉 ==========
    armRotation: {
        calculate: function(pose) {
            const lm = EXERCISES_CONFIG.chestPush.poseMapping.landmarks;

            // 左手臂角度
            const leftAngle = calculateAngle(
                pose[lm.leftShoulder],
                pose[lm.leftElbow],
                pose[lm.leftWrist]
            );

            // 右手臂角度
            const rightAngle = calculateAngle(
                pose[lm.rightShoulder],
                pose[lm.rightElbow],
                pose[lm.rightWrist]
            );

            return {
                leftAngle: leftAngle,
                rightAngle: rightAngle,
                avgAngle: (leftAngle + rightAngle) / 2,
            };
        },

        apply: function(modelParts, calculationResult) {
            const config = EXERCISES_CONFIG.chestPush;
            const leftMuscle = modelParts[config.model.parts.muscles.pectoralisMajorL];
            const rightMuscle = modelParts[config.model.parts.muscles.pectoralisMajorR];

            // 根據手臂角度旋轉胸肌
            if (leftMuscle) {
                leftMuscle.rotation.y = calculationResult.leftAngle * 0.5;
            }
            if (rightMuscle) {
                rightMuscle.rotation.y = -calculationResult.rightAngle * 0.5;
            }
        }
    }
};

// 輔助函數：計算三點之間的角度
function calculateAngle(p1, p0, p2) {
    if (!p1 || !p0 || !p2) return 0;

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

    const dotProduct = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
    const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
    const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);

    if (mag1 === 0 || mag2 === 0) return 0;

    return Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));
}

// 實際使用：動畫胸推
function animateChestPush(pose, modelParts) {
    // 計算胸肌膨脹
    const expansionResult = CHEST_PUSH_MAPPING.chestExpansion.calculate(pose);
    CHEST_PUSH_MAPPING.chestExpansion.apply(modelParts, expansionResult);

    // 計算手臂旋轉
    const rotationResult = CHEST_PUSH_MAPPING.armRotation.calculate(pose);
    CHEST_PUSH_MAPPING.armRotation.apply(modelParts, rotationResult);

    // 返回分析數據（用於顯示）
    return {
        pushProgress: expansionResult.pushProgress,
        armAngle: rotationResult.avgAngle,
        rep: Math.floor(expansionResult.pushProgress * 100) + '%',
    };
}
