/**
 * AnatomyTracker 主程序
 */

let scene, camera, renderer;
let poseDetector, modelAnimator;
let fpsCounter, poseSmoother;
let debugMode = false;
let lastPoseData = null;

/**
 * 初始化Three.js場景
 */
function initScene() {
    const container = document.getElementById('canvas-container');

    // 場景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50);

    // 相機
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 燈光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 地面（可選）
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    scene.add(ground);

    // 視窗調整事件
    window.addEventListener('resize', onWindowResize);
}

/**
 * 初始化所有組件
 */
async function initialize() {
    updateStatus('初始化中...');

    try {
        // 初始化計數器和平滑器
        fpsCounter = new FPSCounter();
        poseSmoother = new PoseSmoother(0.7);

        // 初始化姿勢檢測器
        poseDetector = new PoseDetector(onPoseResults);
        await poseDetector.initialize();

        // 初始化模型動畫器
        modelAnimator = new ModelAnimator(scene);

        // 加載模型（確保models文件夾中有anatomy.glb）
        await modelAnimator.loadModel('models/anatomy.glb');

        updateStatus('✓ 準備就緒');

        // 開始動畫循環
        animate();

    } catch (error) {
        console.error('初始化失敗:', error);
        updateStatus('✗ 初始化失敗: ' + error.message);
    }
}

/**
 * 姿勢檢測結果回調
 */
function onPoseResults(results) {
    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
        return;
    }

    // 平滑pose數據
    const smoothedPose = poseSmoother.smooth(results);

    // 將MediaPipe坐標轉換為Three.js坐標
    const poseData = mediapipeToThreeJS(smoothedPose, 320, 240);

    lastPoseData = poseData;

    // 更新UI信息
    updatePoseInfo(Object.keys(poseData).length);
}

/**
 * 動畫循環
 */
function animate() {
    requestAnimationFrame(animate);

    // 更新FPS
    const currentFps = fpsCounter.update();
    document.getElementById('fps').textContent = `FPS: ${currentFps}`;

    // 使用最新的姿勢數據驅動模型
    if (lastPoseData && modelAnimator.isModelLoaded()) {
        modelAnimator.animateWithPose(lastPoseData);
    }

    // 旋轉模型以獲得更好的視角
    if (modelAnimator.getModel()) {
        modelAnimator.getModel().rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

/**
 * 窗口調整事件
 */
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * 更新狀態文本
 */
function updateStatus(text) {
    document.getElementById('status').textContent = text;
}

/**
 * 更新姿勢信息
 */
function updatePoseInfo(count) {
    document.getElementById('pose-info').textContent = `檢測到的節點: ${count}`;
}

/**
 * 按鈕事件監聽器
 */
document.getElementById('toggle-camera').addEventListener('click', async () => {
    const btn = document.getElementById('toggle-camera');
    const cameraContainer = document.getElementById('camera-container');

    if (poseDetector.getIsRunning()) {
        poseDetector.stopCamera();
        btn.textContent = '開啟鏡頭';
        cameraContainer.style.display = 'none';
        updateStatus('✓ 鏡頭已關閉');
    } else {
        try {
            updateStatus('啟動鏡頭中...');
            await poseDetector.startCamera();
            btn.textContent = '關閉鏡頭';
            cameraContainer.style.display = 'block';
            updateStatus('✓ 鏡頭已開啟');
        } catch (error) {
            updateStatus('✗ 無法開啟鏡頭: ' + error.message);
        }
    }
});

document.getElementById('toggle-debug').addEventListener('click', () => {
    debugMode = !debugMode;
    const btn = document.getElementById('toggle-debug');
    btn.textContent = debugMode ? '調試模式: 開' : '調試模式: 關';
    btn.style.backgroundColor = debugMode ? '#e74c3c' : '#3498db';
});

/**
 * 使窗口對象可用於調試
 */
window.scene = scene;
window.camera = camera;
window.poseDetector = poseDetector;
window.modelAnimator = modelAnimator;

/**
 * 頁面加載完成後初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    initScene();
    initialize();
});