/**
 * UI 交互 — 表单读取、联动、结果渲染
 */

// 盒子联动状态
let boxLengthManual = false;
let boxWidthManual = false;

// ============================================================
// 初始化
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    initViewers();
    setupLinkage();
    setLanguage('en');
    // 打开即计算一次示例
    doCalculate();
});

// ============================================================
// 地板 → 盒子联动（盒子长宽 = 地板尺寸 + 包装余量）
// ============================================================
function getPackingAllowance() {
    return parseFloat(document.getElementById('packing_allowance').value) || 0;
}

function updateBoxLinkage() {
    const pa = getPackingAllowance();
    if (!boxLengthManual) {
        document.getElementById('box_length').value = parseFloat(document.getElementById('floor_length').value || 0) + pa;
    }
    if (!boxWidthManual) {
        document.getElementById('box_width').value = parseFloat(document.getElementById('floor_width').value || 0) + pa;
    }
}

function setupLinkage() {
    // 地板尺寸变化 → 更新盒子尺寸
    document.getElementById('floor_length').addEventListener('input', updateBoxLinkage);
    document.getElementById('floor_width').addEventListener('input', updateBoxLinkage);
    // 包装余量变化 → 也更新盒子尺寸
    document.getElementById('packing_allowance').addEventListener('input', updateBoxLinkage);
    // 手动修改盒子尺寸时解除联动
    document.getElementById('box_length').addEventListener('input', () => { boxLengthManual = true; });
    document.getElementById('box_width').addEventListener('input', () => { boxWidthManual = true; });
}

function resetBoxDefaults() {
    boxLengthManual = false;
    boxWidthManual = false;
    updateBoxLinkage();
}

// ============================================================
// 读取表单参数
// ============================================================
function readInputs() {
    const v = id => parseFloat(document.getElementById(id).value) || 0;
    return {
        floor: { length: v('floor_length'), width: v('floor_width'), thickness: v('floor_thickness'), density: v('floor_density') },
        box: { length: v('box_length'), width: v('box_width'), piecesPerBox: v('pieces_per_box'), packingAllowance: v('packing_allowance') },
        pallet: { length: v('pallet_length'), width: v('pallet_width'), height: v('pallet_height'), selfWeight: v('pallet_self_weight') },
        gaps: { boxGap: v('box_gap'), palletGap: v('pallet_gap'), wallGap: v('wall_gap') },
        limits: {
            boxWeightLimit: v('box_weight_limit'),
            palletWeightLimit: v('pallet_weight_limit'),
            containerWeightLimit: v('container_weight_limit'),
            safeHeight: v('safe_height'),
        },
        container: { length: v('container_l'), width: v('container_w'), height: v('container_h') },
    };
}

// ============================================================
// 主计算
// ============================================================
function doCalculate() {
    const input = readInputs();
    const result = calculateAll(input);
    result.input = input; // attach for 3D use
    window._lastResult = result;
    renderResults(result);
    renderPallet3D(result);
    renderContainer3D(result);
}

// ============================================================
// 渲染结果
// ============================================================
function renderResults(result) {
    const { boxParams, layerInfo, stackInfo, palletSummary, containerTotal, warnings } = result;
    const input = result.input;

    // === Warnings ===
    const wa = document.getElementById('warnings_area');
    if (warnings.length === 0) {
        wa.innerHTML = `<div class="warning-box success" style="margin-bottom:0.75rem;">✅ ${t('r_pass')} — All constraints satisfied</div>`;
    } else {
        wa.innerHTML = warnings.map(w => {
            const cls = w.type === 'error' ? 'error' : 'warning';
            return `<div class="warning-box ${cls}">${t(w.key, w.params)}</div>`;
        }).join('');
    }

    // === Box Result ===
    const boxLimitOk = !input.limits.boxWeightLimit || boxParams.boxWeight <= input.limits.boxWeightLimit;
    document.getElementById('result_box_content').innerHTML = `
        ${row(t('r_piece_weight'), boxParams.pieceWeight + ' kg')}
        ${row(t('r_box_weight'), boxParams.boxWeight + ' kg')}
        ${row(t('r_box_area'), boxParams.boxArea + ' m²')}
        ${row(t('r_box_size'), `${boxParams.boxLength} × ${boxParams.boxWidth} × ${boxParams.boxHeight} mm`)}
        ${row(t('r_box_limit_check'), boxLimitOk
            ? `<span style="color:#16a34a">${t('r_pass')}</span>`
            : `<span style="color:#dc2626">${t('r_over')}</span>`)}
    `;

    // === Pallet Result ===
    let layerDesc;
    if (layerInfo.direction === 'C') {
        layerDesc = t('r_layer_layout_desc_C', {
            aCols: layerInfo.aCols, aRows: layerInfo.aRows,
            bCols: layerInfo.bCols, bRows: layerInfo.bRows,
            count: layerInfo.count,
        });
    } else {
        const dirKey = layerInfo.direction === 'A' ? 'r_layer_layout_desc_A' : 'r_layer_layout_desc_B';
        layerDesc = t(dirKey, { cols: layerInfo.cols, rows: layerInfo.rows, count: layerInfo.count });
    }
    const limitNote = stackInfo.maxByHeight <= stackInfo.maxByWeight ? t('limit_by_height') : t('limit_by_weight');

    document.getElementById('result_pallet_content').innerHTML = `
        ${row(t('r_layer_layout'), layerDesc)}
        ${row(t('r_layers'), `${palletSummary.layers} ${t('r_layers_unit')} <span style="color:#9ca3af;font-size:0.75rem">${limitNote}</span>`)}
        ${row(t('r_pallet_total_boxes'), palletSummary.totalBoxes + ' ' + t('r_boxes_unit'))}
        ${row(t('r_pallet_total_pieces'), palletSummary.totalPieces + ' ' + t('r_pieces_unit'))}
        ${row(t('r_pallet_total_area'), palletSummary.totalArea + ' m²')}
        ${row(t('r_cargo_height'), palletSummary.cargoHeight + ' mm')}
        ${row(t('r_pallet_total_height'), palletSummary.totalHeight + ' mm')}
        ${row(t('r_pallet_total_weight'), palletSummary.totalWeight + ' kg')}
    `;

    // === Container Result ===
    const flDesc = formatFloorLayout(containerTotal);
    document.getElementById('result_container_content').innerHTML = `
        ${row(t('r_floor_layout'), flDesc)}
        ${row(t('r_vertical_layers'), containerTotal.verticalLayers + ' ' + t('r_layers_unit'))}
        ${row(t('r_total_pallets'), containerTotal.actualPallets + ' ' + t('r_pallets_unit'))}
        ${row(t('r_container_total_boxes'), containerTotal.totalBoxes + ' ' + t('r_boxes_unit'))}
        ${row(t('r_container_total_pieces'), containerTotal.totalPieces + ' ' + t('r_pieces_unit'))}
        ${row(t('r_container_total_area'), containerTotal.totalArea + ' m²')}
        ${row(t('r_container_total_weight'), containerTotal.totalWeight + ' kg')}
        ${row(t('r_space_util'), containerTotal.spaceUtil + '%')}
        ${row(t('r_weight_util'), containerTotal.weightUtil + '%')}
    `;
}

// ============================================================
// 辅助函数
// ============================================================
function row(label, value) {
    return `<div class="result-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;
}

function formatFloorLayout(ct) {
    const d = ct.floorLayout.desc;
    if (!d) return '-';
    const hasH = d.hCount > 0 && d.hRows > 0;
    const hasV = d.vCount > 0 && d.vRows > 0;

    if (hasH && hasV) {
        return t('layout_mix', { h: d.hCount, hr: d.hRows, v: d.vCount, vr: d.vRows, n: ct.floorPallets });
    } else if (hasH) {
        return t('layout_pure_h', { h: d.hCount, hr: d.hRows, n: ct.floorPallets });
    } else if (hasV) {
        return t('layout_pure_v', { v: d.vCount, vr: d.vRows, n: ct.floorPallets });
    }
    return '-';
}
