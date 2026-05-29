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
            // 胸肌膨脹 - 肩膀距離變大
            chestExpand: {
                landmarks: [11, 12],  // 左右肩
                muscles: ['pectoralisMajorL', 'pectoralisMajorR'],
                action: 'scale',
                minDistance: 0.3,  // 肩膀最小距離（歸一化）
                maxDistance: 0.5,
            },

            // 手臂推出 - 肘點前移
            armExtend: {
                landmarks: [13, 14],  // 左右肘
                muscles: ['pectoralisMajorL', 'pectoralisMajorR'],
                action: 'position',
                axis: 'z',  // Z 軸推出
            }
        },

        // 訓練設定
        training: {
            defaultSets: 4,
            defaultReps: 8,
            defaultRest: 90,  // 秒
        }
    },

    // 背闊肌下拉（未來）
    latPulldown: {
        id: 'lat-pulldown',
        name: '背闊肌下拉 (Lat Pulldown)',
        category: 'back',
        difficulty: 'beginner',
        icon: '🔻',
        thumbnail: 'https://via.placeholder.com/200?text=Lat+Pulldown',
        description: '鍛鍊背闊肌的孤立動作',

        model: {
            path: 'models/back.glb',  // 未來添加
            parts: {}
        },
        poseMapping: {},
        training: { defaultSets: 4, defaultReps: 10, defaultRest: 60 }
    },

    // 深蹲（未來）
    squat: {
        id: 'squat',
        name: '深蹲 (Squat)',
        category: 'legs',
        difficulty: 'advanced',
        icon: '🦵',
        thumbnail: 'https://via.placeholder.com/200?text=Squat',
        description: '複合下肢動作，鍛鍊股四頭肌、臀肌和腿筋',

        model: {
            path: 'models/legs.glb',  // 未來添加
            parts: {}
        },
        poseMapping: {},
        training: { defaultSets: 5, defaultReps: 5, defaultRest: 120 }
    },
};

// 按類別分組
const EXERCISES_BY_CATEGORY = {
    chest: ['chest-push'],
    back: ['lat-pulldown'],
    legs: ['squat'],
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

// 按類別取得動作
function getExercisesByCategory(category) {
    const ids = EXERCISES_BY_CATEGORY[category] || [];
    return ids.map(id => getExerciseById(id)).filter(e => e);
}