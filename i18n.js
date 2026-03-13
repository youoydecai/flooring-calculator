/**
 * 中英双语系统
 */
const T = {
    zh: {
        // Header
        app_title: '地板装柜计算软件',
        btn_lang: 'EN',
        btn_calculate: '计 算',

        // Floor params
        card_floor: '单片地板参数',
        floor_length: '地板长 (mm)',
        floor_width: '地板宽 (mm)',
        floor_thickness: '地板厚度 (mm)',
        floor_density: '密度 (g/cm³)',

        // Box params
        card_box: '包装（盒）参数',
        box_length: '盒子长 (mm)',
        box_width: '盒子宽 (mm)',
        pieces_per_box: '每盒片数',
        packing_allowance: '包装余量 (mm)',
        btn_reset_box: '重置为默认',
        box_auto_hint: '= 地板尺寸 + 包装余量',

        // Pallet params
        card_pallet: '托盘参数',
        pallet_length: '托盘长 (mm)',
        pallet_width: '托盘宽 (mm)',
        pallet_height: '托盘高度 (mm)',
        pallet_self_weight: '托盘自重 (kg)',

        // Gap params
        card_gaps: '间隙参数',
        box_gap: '盒与盒间隙 (mm)',
        pallet_gap: '托盘间隙 (mm)',
        wall_gap: '货柜壁间隙 (mm)',

        // Limits
        card_limits: '限制条件',
        box_weight_limit: '一盒限重 (kg)',
        pallet_weight_limit: '托盘限重 (kg)',
        container_weight_limit: '货柜限重 (kg)',
        safe_height: '叠放安全高度 (mm)',
        container_size: '20尺货柜内部尺寸',
        container_l: '长 (mm)',
        container_w: '宽 (mm)',
        container_h: '高 (mm)',

        // Results - Box
        result_box: '📦 单盒信息',
        r_piece_weight: '单片重量',
        r_box_weight: '单盒重量',
        r_box_area: '单盒面积',
        r_box_size: '单盒尺寸',
        r_box_limit_check: '限重校验',
        r_pass: '✅ 通过',
        r_over: '❌ 超限',

        // Results - Pallet
        result_pallet: '🔲 单托盘信息',
        r_layer_layout: '排列方式',
        r_layer_layout_desc_A: '横放 {cols}列 × {rows}行 = {count}盒/层',
        r_layer_layout_desc_B: '竖放 {cols}列 × {rows}行 = {count}盒/层',
        r_layer_layout_desc_C: '混放 横{aCols}×{aRows} + 竖{bCols}×{bRows} = {count}盒/层',
        r_layers: '层数',
        r_pallet_total_boxes: '总盒数',
        r_pallet_total_pieces: '总片数',
        r_pallet_total_area: '总面积',
        r_cargo_height: '货物高度',
        r_pallet_total_height: '含底座总高',
        r_pallet_total_weight: '总重量',

        // Results - Container
        result_container: '🚛 货柜信息',
        r_floor_layout: '底面排列',
        r_vertical_layers: '垂直叠放层数',
        r_total_pallets: '可装托盘总数',
        r_container_total_boxes: '总盒数',
        r_container_total_pieces: '总片数',
        r_container_total_area: '总面积',
        r_container_total_weight: '总重量',
        r_space_util: '空间利用率',
        r_weight_util: '重量利用率',

        // Floor layout descriptions
        layout_pure_h: '纯横放 {h}×{hr} = {n}托盘/层',
        layout_pure_v: '纯竖放 {v}×{vr} = {n}托盘/层',
        layout_mix: '横放 {h}×{hr} + 竖放 {v}×{vr} = {n}托盘/层',

        // Warnings
        warn_box_overweight: '⚠️ 单盒重量 {current}kg 超过限制 {limit}kg，建议每盒片数减少至 {suggest} 片',
        warn_pallet_overweight: '⚠️ 托盘总重 {current}kg 超过限制 {limit}kg，已自动减少层数',
        warn_container_overweight: '⚠️ 货柜总重 {current}kg 超过限制 {limit}kg，已自动减少托盘数',
        warn_pallet_too_tall: '❌ 托盘含底座总高 {current}mm 超过货柜高度 {limit}mm，无法装柜',

        // 3D
        view_pallet: '托盘 3D 视图',
        view_container: '货柜 3D 视图',
        btn_reset_view: '重置视角',

        // Units
        unit_kg: 'kg',
        unit_mm: 'mm',
        unit_m2: 'm²',
        unit_pct: '%',
        r_layers_unit: '层',
        r_pieces_unit: '片',
        r_boxes_unit: '盒',
        r_pallets_unit: '个',

        // Limit reason
        limit_by_height: '(受高度限制)',
        limit_by_weight: '(受重量限制)',
    },
    en: {
        app_title: 'Flooring Container Loading Calculator',
        btn_lang: '中文',
        btn_calculate: 'Calculate',

        card_floor: 'Floor Tile Parameters',
        floor_length: 'Tile Length (mm)',
        floor_width: 'Tile Width (mm)',
        floor_thickness: 'Tile Thickness (mm)',
        floor_density: 'Density (g/cm³)',

        card_box: 'Packaging (Box) Parameters',
        box_length: 'Box Length (mm)',
        box_width: 'Box Width (mm)',
        pieces_per_box: 'Pieces Per Box',
        packing_allowance: 'Packing Allowance (mm)',
        btn_reset_box: 'Reset to Default',
        box_auto_hint: '= tile size + packing allowance',

        card_pallet: 'Pallet Parameters',
        pallet_length: 'Pallet Length (mm)',
        pallet_width: 'Pallet Width (mm)',
        pallet_height: 'Pallet Height (mm)',
        pallet_self_weight: 'Pallet Weight (kg)',

        card_gaps: 'Gap Parameters',
        box_gap: 'Box-to-Box Gap (mm)',
        pallet_gap: 'Pallet-to-Pallet Gap (mm)',
        wall_gap: 'Wall Gap (mm)',

        card_limits: 'Constraints',
        box_weight_limit: 'Box Weight Limit (kg)',
        pallet_weight_limit: 'Pallet Weight Limit (kg)',
        container_weight_limit: 'Container Weight Limit (kg)',
        safe_height: 'Safe Stacking Height (mm)',
        container_size: '20ft Container Interior Size',
        container_l: 'Length (mm)',
        container_w: 'Width (mm)',
        container_h: 'Height (mm)',

        result_box: '📦 Box Info',
        r_piece_weight: 'Piece Weight',
        r_box_weight: 'Box Weight',
        r_box_area: 'Box Area',
        r_box_size: 'Box Dimensions',
        r_box_limit_check: 'Weight Check',
        r_pass: '✅ Pass',
        r_over: '❌ Over Limit',

        result_pallet: '🔲 Pallet Info',
        r_layer_layout: 'Layout',
        r_layer_layout_desc_A: 'Lengthwise {cols}col × {rows}row = {count} boxes/layer',
        r_layer_layout_desc_B: 'Widthwise {cols}col × {rows}row = {count} boxes/layer',
        r_layer_layout_desc_C: 'Mixed L{aCols}×{aRows} + W{bCols}×{bRows} = {count} boxes/layer',
        r_layers: 'Layers',
        r_pallet_total_boxes: 'Total Boxes',
        r_pallet_total_pieces: 'Total Pieces',
        r_pallet_total_area: 'Total Area',
        r_cargo_height: 'Cargo Height',
        r_pallet_total_height: 'Total Height (w/ base)',
        r_pallet_total_weight: 'Total Weight',

        result_container: '🚛 Container Info',
        r_floor_layout: 'Floor Layout',
        r_vertical_layers: 'Vertical Stack Layers',
        r_total_pallets: 'Total Pallets',
        r_container_total_boxes: 'Total Boxes',
        r_container_total_pieces: 'Total Pieces',
        r_container_total_area: 'Total Area',
        r_container_total_weight: 'Total Weight',
        r_space_util: 'Space Utilization',
        r_weight_util: 'Weight Utilization',

        layout_pure_h: 'Lengthwise {h}×{hr} = {n} pallets/layer',
        layout_pure_v: 'Widthwise {v}×{vr} = {n} pallets/layer',
        layout_mix: 'Lengthwise {h}×{hr} + Widthwise {v}×{vr} = {n} pallets/layer',

        warn_box_overweight: '⚠️ Box weight {current}kg exceeds limit {limit}kg. Suggest reducing to {suggest} pieces/box.',
        warn_pallet_overweight: '⚠️ Pallet weight {current}kg exceeds limit {limit}kg. Layers reduced automatically.',
        warn_container_overweight: '⚠️ Container weight {current}kg exceeds limit {limit}kg. Pallets reduced automatically.',
        warn_pallet_too_tall: '❌ Pallet total height {current}mm exceeds container height {limit}mm. Cannot load.',

        view_pallet: 'Pallet 3D View',
        view_container: 'Container 3D View',
        btn_reset_view: 'Reset View',

        unit_kg: 'kg',
        unit_mm: 'mm',
        unit_m2: 'm²',
        unit_pct: '%',
        r_layers_unit: 'layers',
        r_pieces_unit: 'pcs',
        r_boxes_unit: 'boxes',
        r_pallets_unit: 'pallets',

        limit_by_height: '(height limited)',
        limit_by_weight: '(weight limited)',
    },
};

let currentLang = 'en';

function t(key, params) {
    let s = T[currentLang][key] || T['en'][key] || key;
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
    }
    return s;
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' && el.type !== 'button' && el.type !== 'submit') {
            el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    // Update lang button
    const btn = document.getElementById('btn_lang');
    if (btn) btn.textContent = t('btn_lang');
}

function toggleLanguage() {
    setLanguage(currentLang === 'zh' ? 'en' : 'zh');
    // Re-render results if they exist
    if (typeof renderResults === 'function' && window._lastResult) {
        renderResults(window._lastResult);
    }
}
