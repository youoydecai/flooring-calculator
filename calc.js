/**
 * 地板装柜计算引擎 — 纯逻辑，无 DOM 依赖
 * 四级计算：地板片 → 盒子 → 托盘 → 货柜
 */

// ============================================================
// 4.1 单片地板重量
// ============================================================
function calcPieceWeight(floor) {
    // mm³ → cm³ 需 ÷1000, g → kg 需 ÷1000, 合计 ÷1,000,000
    return floor.length * floor.width * floor.thickness * floor.density / 1_000_000;
}

// ============================================================
// 4.2 单盒参数
// ============================================================
function calcBoxParams(floor, box) {
    const pieceWeight = calcPieceWeight(floor);
    const boxWeight = pieceWeight * box.piecesPerBox;
    const boxArea = box.piecesPerBox * floor.length * floor.width / 1_000_000; // m²
    const boxHeight = floor.thickness * box.piecesPerBox + box.packingAllowance;

    return {
        pieceWeight: round4(pieceWeight),
        boxWeight: round4(boxWeight),
        boxArea: round4(boxArea),
        boxHeight: round2(boxHeight),
        boxLength: box.length,
        boxWidth: box.width,
    };
}

// ============================================================
// 4.3 每层排列盒数（支持横竖混放，含间隙）
// ============================================================
function calcLayerLayout(palletL, palletW, boxL, boxW, boxGap) {
    // 方式A：盒子长沿托盘长方向（全部同向）
    const colsA = Math.floor((palletL + boxGap) / (boxL + boxGap));
    const rowsA = Math.floor((palletW + boxGap) / (boxW + boxGap));
    const countA = colsA * rowsA;

    // 方式B：盒子旋转90°（全部同向）
    const colsB = Math.floor((palletL + boxGap) / (boxW + boxGap));
    const rowsB = Math.floor((palletW + boxGap) / (boxL + boxGap));
    const countB = colsB * rowsB;

    // 方式C：横竖混放遍历
    let bestMix = { count: 0, aCols: 0, aRows: 0, bCols: 0, bRows: 0, aUsed: 0, fromB: false };

    // C1: 沿托盘长方向，先放 i 列 A方向盒子(boxL沿X)，剩余放 B方向盒子(boxW沿X)
    const maxACols = Math.floor((palletL + boxGap) / (boxL + boxGap));
    for (let i = 0; i <= maxACols; i++) {
        const aUsed = i > 0 ? i * (boxL + boxGap) : 0;
        const aRows = i > 0 ? Math.floor((palletW + boxGap) / (boxW + boxGap)) : 0;
        const aTotal = i * aRows;

        const remain = palletL - aUsed;
        let bColsC = 0, bRowsC = 0;
        if (remain > 0) {
            bColsC = Math.floor((remain + boxGap) / (boxW + boxGap));
            bRowsC = Math.floor((palletW + boxGap) / (boxL + boxGap));
        }
        const bTotal = bColsC * bRowsC;
        const total = aTotal + bTotal;

        if (total > bestMix.count) {
            bestMix = { count: total, aCols: i, aRows, bCols: bColsC, bRows: bRowsC, aUsed, fromB: false };
        }
    }

    // C2: 沿托盘长方向，先放 j 列 B方向盒子(boxW沿X)，剩余放 A方向盒子(boxL沿X)
    const maxBCols = Math.floor((palletL + boxGap) / (boxW + boxGap));
    for (let j = 0; j <= maxBCols; j++) {
        const bUsed = j > 0 ? j * (boxW + boxGap) : 0;
        const bRowsC = j > 0 ? Math.floor((palletW + boxGap) / (boxL + boxGap)) : 0;
        const bTotal = j * bRowsC;

        const remain = palletL - bUsed;
        let aColsC = 0, aRowsC = 0;
        if (remain > 0) {
            aColsC = Math.floor((remain + boxGap) / (boxL + boxGap));
            aRowsC = Math.floor((palletW + boxGap) / (boxW + boxGap));
        }
        const aTotal = aColsC * aRowsC;
        const total = bTotal + aTotal;

        if (total > bestMix.count) {
            bestMix = { count: total, aCols: aColsC, aRows: aRowsC, bCols: j, bRows: bRowsC, bUsed, fromB: true };
        }
    }

    // 选择最优方案：混放严格优于纯放才使用混放
    if (bestMix.count > countA && bestMix.count > countB) {
        return {
            count: bestMix.count, direction: 'C',
            aCols: bestMix.aCols, aRows: bestMix.aRows,
            bCols: bestMix.bCols, bRows: bestMix.bRows,
            placements: genBoxPlacements_mix(bestMix, boxL, boxW, boxGap),
        };
    } else if (countA >= countB) {
        return {
            count: countA, cols: colsA, rows: rowsA, direction: 'A',
            boxDirL: boxL, boxDirW: boxW,
            placements: genBoxPlacements_pure(colsA, rowsA, boxL, boxW, boxGap, 'A'),
        };
    } else {
        return {
            count: countB, cols: colsB, rows: rowsB, direction: 'B',
            boxDirL: boxW, boxDirW: boxL,
            placements: genBoxPlacements_pure(colsB, rowsB, boxW, boxL, boxGap, 'B'),
        };
    }
}

// 生成纯排列盒子 placement (用于3D渲染)
function genBoxPlacements_pure(cols, rows, dirL, dirW, gap, orientation) {
    const placements = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            placements.push({
                x: c * (dirL + gap), z: r * (dirW + gap),
                l: dirL, w: dirW, orientation,
            });
        }
    }
    return placements;
}

// 生成混放盒子 placement
function genBoxPlacements_mix(mix, boxL, boxW, gap) {
    const placements = [];
    if (mix.fromB) {
        // 先B后A：先放 bCols 列竖放盒子，剩余放 A方向盒子
        const bUsed = mix.bUsed || (mix.bCols > 0 ? mix.bCols * (boxW + gap) : 0);
        for (let r = 0; r < mix.bRows; r++) {
            for (let c = 0; c < mix.bCols; c++) {
                placements.push({
                    x: c * (boxW + gap), z: r * (boxL + gap),
                    l: boxW, w: boxL, orientation: 'B',
                });
            }
        }
        for (let r = 0; r < mix.aRows; r++) {
            for (let c = 0; c < mix.aCols; c++) {
                placements.push({
                    x: bUsed + c * (boxL + gap), z: r * (boxW + gap),
                    l: boxL, w: boxW, orientation: 'A',
                });
            }
        }
    } else {
        // 先A后B：先放 aCols 列横放盒子，剩余放 B方向盒子
        const aUsed = mix.aUsed || (mix.aCols > 0 ? mix.aCols * (boxL + gap) : 0);
        for (let r = 0; r < mix.aRows; r++) {
            for (let c = 0; c < mix.aCols; c++) {
                placements.push({
                    x: c * (boxL + gap), z: r * (boxW + gap),
                    l: boxL, w: boxW, orientation: 'A',
                });
            }
        }
        for (let r = 0; r < mix.bRows; r++) {
            for (let c = 0; c < mix.bCols; c++) {
                placements.push({
                    x: aUsed + c * (boxW + gap), z: r * (boxL + gap),
                    l: boxW, w: boxL, orientation: 'B',
                });
            }
        }
    }
    return placements;
}

// ============================================================
// 4.4 托盘层数
// ============================================================
function calcPalletStack(layerCount, boxWeight, boxHeight, palletSelfWeight, palletWeightLimit, safeHeight) {
    if (layerCount <= 0 || boxHeight <= 0) return { layers: 0 };

    const maxByHeight = Math.floor(safeHeight / boxHeight);

    let maxByWeight = Infinity;
    if (palletWeightLimit > 0 && boxWeight > 0 && layerCount > 0) {
        const weightPerLayer = layerCount * boxWeight;
        const availableWeight = palletWeightLimit - palletSelfWeight;
        maxByWeight = availableWeight > 0 ? Math.floor(availableWeight / weightPerLayer) : 0;
    }

    const layers = Math.max(0, Math.min(maxByHeight, maxByWeight));
    return { layers, maxByHeight, maxByWeight };
}

// ============================================================
// 4.5 单托盘汇总
// ============================================================
function calcPalletSummary(layerInfo, stackInfo, boxParams, piecesPerBox, palletHeight, palletSelfWeight) {
    const totalBoxes = layerInfo.count * stackInfo.layers;
    const totalPieces = totalBoxes * piecesPerBox;
    const cargoHeight = stackInfo.layers * boxParams.boxHeight;
    const totalHeight = cargoHeight + palletHeight;
    const totalWeight = totalBoxes * boxParams.boxWeight + palletSelfWeight;
    const totalArea = totalPieces * boxParams.boxLength * boxParams.boxWidth / 1_000_000; // 注意这里用的是盒子内地板的尺寸

    return {
        totalBoxes,
        totalPieces,
        cargoHeight: round2(cargoHeight),
        totalHeight: round2(totalHeight),
        totalWeight: round2(totalWeight),
        totalArea: round4(totalArea),
        boxesPerLayer: layerInfo.count,
        layers: stackInfo.layers,
    };
}

// ============================================================
// 4.6 货柜装托盘数 — 支持横竖混放 + 垂直叠放
// ============================================================

// 4.6.1 货柜有效空间
function calcContainerEffective(container, wallGap) {
    return {
        length: container.length - 2 * wallGap,
        width: container.width - 2 * wallGap,
        height: container.height,
    };
}

// 4.6.2 底面排列
function calcContainerFloorLayout(effL, effW, palletL, palletW, palletGap) {
    // 方式A：纯横放（托盘长沿货柜长）
    const aAlongL = Math.floor((effL + palletGap) / (palletL + palletGap));
    const aAlongW = Math.floor((effW + palletGap) / (palletW + palletGap));
    const countA = aAlongL * aAlongW;
    const layoutA = {
        count: countA, type: 'A',
        desc: { hCount: aAlongL, hRows: aAlongW, vCount: 0, vRows: 0 },
        placements: generatePurePlacements(aAlongL, aAlongW, palletL, palletW, palletGap, 'H'),
    };

    // 方式B：纯竖放（托盘长沿货柜宽）
    const bAlongL = Math.floor((effL + palletGap) / (palletW + palletGap));
    const bAlongW = Math.floor((effW + palletGap) / (palletL + palletGap));
    const countB = bAlongL * bAlongW;
    const layoutB = {
        count: countB, type: 'B',
        desc: { hCount: 0, hRows: 0, vCount: bAlongL, vRows: bAlongW },
        placements: generatePurePlacements(bAlongL, bAlongW, palletW, palletL, palletGap, 'V'),
    };

    // 方式C：混放遍历
    let bestMix = { count: 0, desc: null, placements: [] };

    // C1: 先横放 i 个，剩余竖放
    for (let i = 0; i * (palletL + palletGap) - palletGap <= effL; i++) {
        const hUsed = i > 0 ? i * (palletL + palletGap) : 0;
        const hRows = i > 0 ? Math.floor((effW + palletGap) / (palletW + palletGap)) : 0;
        const hTotal = i * hRows;

        const remain = effL - hUsed;
        let vAlongL = 0, vRows = 0, vTotal = 0;
        if (remain > 0) {
            vAlongL = Math.floor((remain + palletGap) / (palletW + palletGap));
            vRows = Math.floor((effW + palletGap) / (palletL + palletGap));
            vTotal = vAlongL * vRows;
        }

        const total = hTotal + vTotal;
        if (total > bestMix.count) {
            bestMix = {
                count: total, type: 'C',
                desc: { hCount: i, hRows, vCount: vAlongL, vRows },
                placements: generateMixPlacements(i, hRows, palletL, palletW, vAlongL, vRows, palletGap, hUsed),
            };
        }
    }

    // C2: 先竖放 j 个，剩余横放
    for (let j = 0; j * (palletW + palletGap) - palletGap <= effL; j++) {
        const vUsed = j > 0 ? j * (palletW + palletGap) : 0;
        const vRows = j > 0 ? Math.floor((effW + palletGap) / (palletL + palletGap)) : 0;
        const vTotal = j * vRows;

        const remain = effL - vUsed;
        let hAlongL = 0, hRows = 0, hTotal = 0;
        if (remain > 0) {
            hAlongL = Math.floor((remain + palletGap) / (palletL + palletGap));
            hRows = Math.floor((effW + palletGap) / (palletW + palletGap));
            hTotal = hAlongL * hRows;
        }

        const total = vTotal + hTotal;
        if (total > bestMix.count) {
            bestMix = {
                count: total, type: 'C',
                desc: { hCount: hAlongL, hRows, vCount: j, vRows },
                placements: generateMixPlacements2(j, vRows, palletW, palletL, hAlongL, hRows, palletL, palletW, palletGap, vUsed),
            };
        }
    }

    // 取最大
    const candidates = [layoutA, layoutB, bestMix];
    candidates.sort((a, b) => b.count - a.count);
    return candidates[0];
}

// 生成纯排列的 placement 数据 (用于3D渲染)
function generatePurePlacements(cols, rows, dirL, dirW, gap, orientation) {
    const placements = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            placements.push({
                x: c * (dirL + gap),
                y: r * (dirW + gap),
                l: dirL, w: dirW,
                orientation, // 'H' or 'V'
            });
        }
    }
    return placements;
}

// 生成混放 placement (先横后竖)
function generateMixPlacements(hCols, hRows, palletL, palletW, vCols, vRows, gap, hUsed) {
    const placements = [];
    // 横放部分
    for (let r = 0; r < hRows; r++) {
        for (let c = 0; c < hCols; c++) {
            placements.push({
                x: c * (palletL + gap),
                y: r * (palletW + gap),
                l: palletL, w: palletW,
                orientation: 'H',
            });
        }
    }
    // 竖放部分
    for (let r = 0; r < vRows; r++) {
        for (let c = 0; c < vCols; c++) {
            placements.push({
                x: hUsed + c * (palletW + gap),
                y: r * (palletL + gap),
                l: palletW, w: palletL,
                orientation: 'V',
            });
        }
    }
    return placements;
}

// 生成混放 placement (先竖后横)
function generateMixPlacements2(vCols, vRows, vDirL, vDirW, hCols, hRows, palletL, palletW, gap, vUsed) {
    const placements = [];
    // 竖放部分
    for (let r = 0; r < vRows; r++) {
        for (let c = 0; c < vCols; c++) {
            placements.push({
                x: c * (vDirL + gap),
                y: r * (vDirW + gap),
                l: vDirL, w: vDirW,
                orientation: 'V',
            });
        }
    }
    // 横放部分
    for (let r = 0; r < hRows; r++) {
        for (let c = 0; c < hCols; c++) {
            placements.push({
                x: vUsed + c * (palletL + gap),
                y: r * (palletW + gap),
                l: palletL, w: palletW,
                orientation: 'H',
            });
        }
    }
    return placements;
}

// 4.6.3 垂直叠放层数
function calcVerticalStack(containerH, palletTotalH) {
    if (palletTotalH <= 0) return 0;
    return Math.floor(containerH / palletTotalH);
}

// 4.6.4 货柜汇总
function calcContainerTotal(floorLayout, verticalLayers, palletSummary, containerWeightLimit) {
    if (palletSummary.totalBoxes === 0 || palletSummary.totalWeight <= 0) {
        return { palletsBySpace: 0, palletsByWeight: 0, actualPallets: 0, verticalLayers: 0,
            floorPallets: 0, totalBoxes: 0, totalPieces: 0, totalWeight: 0, totalArea: 0, floorLayout };
    }
    const bySpace = floorLayout.count * verticalLayers;
    const byWeight = containerWeightLimit > 0
        ? Math.floor(containerWeightLimit / palletSummary.totalWeight)
        : bySpace;
    const actualPallets = Math.min(bySpace, byWeight);

    const totalBoxes = actualPallets * palletSummary.totalBoxes;
    const totalPieces = actualPallets * palletSummary.totalPieces;
    const totalWeight = round2(actualPallets * palletSummary.totalWeight);
    const totalArea = round4(actualPallets * palletSummary.totalArea);

    // 空间利用率 (简化: 托盘体积 / 货柜体积)
    // 这里暂不计算

    return {
        palletsBySpace: bySpace,
        palletsByWeight: byWeight,
        actualPallets,
        verticalLayers,
        floorPallets: floorLayout.count,
        totalBoxes,
        totalPieces,
        totalWeight,
        totalArea,
        floorLayout,
    };
}

// ============================================================
// 4.7 限制条件校验
// ============================================================
function checkLimits(boxParams, palletSummary, containerTotal, limits, piecesPerBox) {
    const warnings = [];

    // 一盒限重
    if (limits.boxWeightLimit > 0 && boxParams.boxWeight > limits.boxWeightLimit) {
        const suggestPieces = Math.floor(limits.boxWeightLimit / boxParams.pieceWeight);
        warnings.push({
            type: 'error',
            key: 'warn_box_overweight',
            params: {
                current: round2(boxParams.boxWeight),
                limit: limits.boxWeightLimit,
                suggest: suggestPieces,
            },
        });
    }

    // 托盘限重
    if (limits.palletWeightLimit > 0 && palletSummary.totalWeight > limits.palletWeightLimit) {
        warnings.push({
            type: 'warning',
            key: 'warn_pallet_overweight',
            params: {
                current: round2(palletSummary.totalWeight),
                limit: limits.palletWeightLimit,
            },
        });
    }

    // 货柜限重
    if (limits.containerWeightLimit > 0 && containerTotal.totalWeight > limits.containerWeightLimit) {
        warnings.push({
            type: 'warning',
            key: 'warn_container_overweight',
            params: {
                current: round2(containerTotal.totalWeight),
                limit: limits.containerWeightLimit,
            },
        });
    }

    // 托盘超高（无法装柜）
    if (palletSummary.totalHeight > limits.containerHeight) {
        warnings.push({
            type: 'error',
            key: 'warn_pallet_too_tall',
            params: {
                current: round2(palletSummary.totalHeight),
                limit: limits.containerHeight,
            },
        });
    }

    return warnings;
}

// ============================================================
// 主计算函数 — 一次性完成全部计算
// ============================================================
function calculateAll(input) {
    const { floor, box, pallet, gaps, limits, container } = input;

    // 1. 单盒参数
    const boxParams = calcBoxParams(floor, box);

    // 2. 每层排列
    const layerInfo = calcLayerLayout(pallet.length, pallet.width, box.length, box.width, gaps.boxGap);

    // 3. 托盘层数
    const stackInfo = calcPalletStack(
        layerInfo.count, boxParams.boxWeight, boxParams.boxHeight,
        pallet.selfWeight, limits.palletWeightLimit, limits.safeHeight
    );

    // 4. 托盘汇总 — 注意 totalArea 需要用地板实际面积
    const palletSummary = calcPalletSummary(
        layerInfo, stackInfo, boxParams, box.piecesPerBox,
        pallet.height, pallet.selfWeight
    );
    // 修正面积用地板尺寸
    palletSummary.totalArea = round4(palletSummary.totalPieces * floor.length * floor.width / 1_000_000);

    // 5. 货柜有效空间
    const eff = calcContainerEffective(container, gaps.wallGap);

    // 6. 底面排列
    const floorLayout = calcContainerFloorLayout(eff.length, eff.width, pallet.length, pallet.width, gaps.palletGap);

    // 7. 垂直叠放
    const verticalLayers = calcVerticalStack(eff.height, palletSummary.totalHeight);

    // 8. 货柜汇总
    const containerTotal = calcContainerTotal(floorLayout, verticalLayers, palletSummary, limits.containerWeightLimit);
    // 修正面积
    containerTotal.totalArea = round4(containerTotal.actualPallets * palletSummary.totalArea);

    // 空间利用率
    const containerVolume = container.length * container.width * container.height;
    const palletVolume = pallet.length * pallet.width * palletSummary.totalHeight;
    containerTotal.spaceUtil = containerVolume > 0
        ? round2(containerTotal.actualPallets * palletVolume / containerVolume * 100)
        : 0;
    containerTotal.weightUtil = limits.containerWeightLimit > 0
        ? round2(containerTotal.totalWeight / limits.containerWeightLimit * 100)
        : 0;

    // 9. 限制校验
    const warnings = checkLimits(boxParams, palletSummary, containerTotal, {
        ...limits,
        containerHeight: container.height,
    }, box.piecesPerBox);

    return {
        boxParams,
        layerInfo,
        stackInfo,
        palletSummary,
        containerTotal,
        warnings,
    };
}

// ============================================================
// 工具函数
// ============================================================
function round2(n) { return Math.round(n * 100) / 100; }
function round4(n) { return Math.round(n * 10000) / 10000; }
