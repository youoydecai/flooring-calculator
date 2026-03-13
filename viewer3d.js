/**
 * Three.js 3D 可视化 — 托盘视图 + 货柜视图
 */

const LAYER_COLORS = [
    0x3b82f6, 0xef4444, 0x22c55e, 0xf59e0b, 0x8b5cf6,
    0x06b6d4, 0xec4899, 0x14b8a6, 0xf97316, 0x6366f1,
    0x84cc16, 0xe11d48, 0x0ea5e9, 0xa855f7, 0xd946ef,
];
const COLOR_H = 0x3b82f6; // 横放托盘 蓝
const COLOR_V = 0x22c55e; // 竖放托盘 绿

// ============================================================
// 通用场景创建
// ============================================================
function createScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    const w = container.clientWidth;
    const h = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(3000, 5000, 2000);
    dir.castShadow = true;
    scene.add(dir);

    // Grid
    const grid = new THREE.GridHelper(5000, 50, 0xdddddd, 0xeeeeee);
    scene.add(grid);

    // Orbit
    const orbit = createOrbitControls(camera, container);

    // Animate
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Resize
    const ro = new ResizeObserver(() => {
        const nw = container.clientWidth;
        const nh = container.clientHeight || 400;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
    });
    ro.observe(container);

    return { scene, camera, renderer, orbit, container };
}

// ============================================================
// Orbit Controls (简易实现)
// ============================================================
function createOrbitControls(camera, container) {
    let isDragging = false, isRight = false, prevX = 0, prevY = 0;
    const state = { theta: Math.PI / 4, phi: Math.PI / 3.5, radius: 3000 };
    const target = new THREE.Vector3(0, 0, 0);

    function update() {
        const x = state.radius * Math.sin(state.phi) * Math.cos(state.theta);
        const y = state.radius * Math.cos(state.phi);
        const z = state.radius * Math.sin(state.phi) * Math.sin(state.theta);
        camera.position.set(target.x + x, target.y + y, target.z + z);
        camera.lookAt(target);
    }

    container.addEventListener('mousedown', e => { isDragging = true; isRight = e.button === 2; prevX = e.clientX; prevY = e.clientY; });
    container.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const dx = e.clientX - prevX, dy = e.clientY - prevY;
        prevX = e.clientX; prevY = e.clientY;
        if (isRight) {
            const s = state.radius * 0.001;
            const right = new THREE.Vector3().crossVectors(camera.up, new THREE.Vector3().subVectors(target, camera.position)).normalize();
            target.addScaledVector(right, dx * s);
            target.addScaledVector(camera.up, dy * s);
        } else {
            state.theta -= dx * 0.005;
            state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi - dy * 0.005));
        }
        update();
    });
    container.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mouseleave', () => isDragging = false);
    container.addEventListener('contextmenu', e => e.preventDefault());
    container.addEventListener('wheel', e => {
        e.preventDefault();
        state.radius *= (1 + e.deltaY * 0.001);
        state.radius = Math.max(200, Math.min(50000, state.radius));
        update();
    }, { passive: false });

    update();
    return { state, target, update };
}

// ============================================================
// 全局视图实例
// ============================================================
let palletView = null;
let containerView = null;
let palletGroup = null;
let containerGroup = null;

function initViewers() {
    palletView = createScene('pallet_viewer');
    containerView = createScene('container_viewer');
}

// ============================================================
// 托盘 3D 视图
// ============================================================
function renderPallet3D(result) {
    if (!palletView) return;
    // 清除旧内容
    if (palletGroup) { palletView.scene.remove(palletGroup); }
    palletGroup = new THREE.Group();

    const pallet = result.palletSummary;
    const layer = result.layerInfo;
    const box = result.boxParams;
    const palletL = result.input.pallet.length;
    const palletW = result.input.pallet.width;
    const palletH = result.input.pallet.height;
    const boxGap = result.input.gaps.boxGap;

    // 托盘底座
    const baseGeo = new THREE.BoxGeometry(palletL, palletH, palletW);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xc2956b, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(palletL / 2, palletH / 2, palletW / 2);
    base.receiveShadow = true;
    palletGroup.add(base);

    // 盒子排列 — 使用 placements 数组支持混放
    const bH = box.boxHeight;
    const placements = layer.placements;

    // 居中偏移：计算所有盒子的包围盒，在托盘上居中
    let maxExtX = 0, maxExtZ = 0;
    for (const p of placements) {
        maxExtX = Math.max(maxExtX, p.x + p.l);
        maxExtZ = Math.max(maxExtZ, p.z + p.w);
    }
    const offsetX = (palletL - maxExtX) / 2;
    const offsetZ = (palletW - maxExtZ) / 2;

    for (let lyr = 0; lyr < pallet.layers; lyr++) {
        const color = LAYER_COLORS[lyr % LAYER_COLORS.length];
        const mat = new THREE.MeshStandardMaterial({
            color, transparent: true, opacity: 0.8, roughness: 0.4,
        });
        const yBase = palletH + lyr * bH;

        for (const p of placements) {
            const geo = new THREE.BoxGeometry(p.l - 0.5, bH - 0.5, p.w - 0.5);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                offsetX + p.x + p.l / 2,
                yBase + bH / 2,
                offsetZ + p.z + p.w / 2
            );
            mesh.castShadow = true;
            const edge = new THREE.LineSegments(
                new THREE.EdgesGeometry(geo),
                new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.15, transparent: true })
            );
            mesh.add(edge);
            palletGroup.add(mesh);
        }
    }

    palletView.scene.add(palletGroup);

    // Camera target
    palletView.orbit.target.set(palletL / 2, (palletH + pallet.cargoHeight) / 2, palletW / 2);
    palletView.orbit.state.radius = Math.max(palletL, palletW, pallet.cargoHeight) * 2.2;
    palletView.orbit.update();
}

// ============================================================
// 货柜 3D 视图
// ============================================================
function renderContainer3D(result) {
    if (!containerView) return;
    if (containerGroup) { containerView.scene.remove(containerGroup); }
    containerGroup = new THREE.Group();

    const ct = result.containerTotal;
    const ps = result.palletSummary;
    const cLen = result.input.container.length;
    const cWid = result.input.container.width;
    const cHei = result.input.container.height;
    const wallGap = result.input.gaps.wallGap;
    const palletH = result.input.pallet.height;

    // 货柜外框 (线框)
    const cGeo = new THREE.BoxGeometry(cLen, cHei, cWid);
    const cEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(cGeo),
        new THREE.LineBasicMaterial({ color: 0x6b7280, linewidth: 2 })
    );
    cEdge.position.set(cLen / 2, cHei / 2, cWid / 2);
    containerGroup.add(cEdge);

    // 货柜地板 (半透明)
    const floorGeo = new THREE.BoxGeometry(cLen, 2, cWid);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.3 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(cLen / 2, 1, cWid / 2);
    containerGroup.add(floorMesh);

    // 托盘排列
    if (ct.floorLayout && ct.floorLayout.placements) {
        const placements = ct.floorLayout.placements;
        const palletTotalH = ps.totalHeight;

        // 计算居中偏移：托盘整体在货柜有效空间内居中
        const effL = cLen - 2 * wallGap;
        const effW = cWid - 2 * wallGap;
        let maxExtentX = 0, maxExtentZ = 0;
        for (const p of placements) {
            maxExtentX = Math.max(maxExtentX, p.x + p.l);
            maxExtentZ = Math.max(maxExtentZ, p.y + p.w);
        }
        const containerOffsetX = (effL - maxExtentX) / 2;
        const containerOffsetZ = (effW - maxExtentZ) / 2;

        for (let stack = 0; stack < ct.verticalLayers; stack++) {
            const yBase = stack * palletTotalH;

            for (const p of placements) {
                // 检查是否超过实际托盘数
                const palletIndex = stack * placements.length + placements.indexOf(p);
                if (palletIndex >= ct.actualPallets) break;

                const color = p.orientation === 'H' ? COLOR_H : COLOR_V;
                const mat = new THREE.MeshStandardMaterial({
                    color, transparent: true, opacity: 0.75, roughness: 0.5,
                });

                const px = wallGap + containerOffsetX + p.x + p.l / 2;
                const pz = wallGap + containerOffsetZ + p.y + p.w / 2;

                // 托盘底座
                const bGeo = new THREE.BoxGeometry(p.l - 2, palletH - 1, p.w - 2);
                const bMesh = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: 0xc2956b, roughness: 0.8 }));
                bMesh.position.set(px, yBase + palletH / 2, pz);
                containerGroup.add(bMesh);

                // 货物块 (简化为一个大方块)
                const cargoH = ps.cargoHeight;
                const cGeo2 = new THREE.BoxGeometry(p.l - 4, cargoH - 2, p.w - 4);
                const cMesh = new THREE.Mesh(cGeo2, mat);
                cMesh.position.set(px, yBase + palletH + cargoH / 2, pz);
                cMesh.castShadow = true;
                // Wireframe
                const edge = new THREE.LineSegments(
                    new THREE.EdgesGeometry(cGeo2),
                    new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.1, transparent: true })
                );
                cMesh.add(edge);
                containerGroup.add(cMesh);
            }
        }
    }

    containerView.scene.add(containerGroup);

    // Camera
    containerView.orbit.target.set(cLen / 2, cHei / 2, cWid / 2);
    containerView.orbit.state.radius = Math.max(cLen, cWid, cHei) * 1.8;
    containerView.orbit.update();
}

// ============================================================
// 重置视角
// ============================================================
function resetPalletCamera() {
    if (!palletView) return;
    palletView.orbit.state.theta = Math.PI / 4;
    palletView.orbit.state.phi = Math.PI / 3.5;
    palletView.orbit.update();
}
function resetContainerCamera() {
    if (!containerView) return;
    containerView.orbit.state.theta = Math.PI / 4;
    containerView.orbit.state.phi = Math.PI / 3.5;
    containerView.orbit.update();
}
