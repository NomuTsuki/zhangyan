# Layout parameters — Experimental registry

所有精确值以 `params.mjs` 为唯一机器来源。这里记录为什么暂用这些数，不把它们升格成产品默认值。

## layout.support-spring

id:            layout.support-spring
value & unit:  ideal 142px; strength 0.150; long threshold 225px; long strength 0.120; degree floor 0.42
identity:      experimental-default
why:           让证据与结论先形成可读局部星座，同时保留多结论共享证据的折中位置
affects:       supports 的常见长度、结论簇紧凑度和高连接结论的吸引力
does NOT affect: 证据是否成立、支持关系数量、结论解锁或 G 语义
status:        experimental
reopen when:   真人仍需横跨画布追支持线，或高连接结论把无关结构吸成一团

## layout.crossing-and-label-objective

id:            layout.crossing-and-label-objective
value & unit:  crossing 7200; shallow crossing 3000; edge-label 11000; overlap/boundary 24000 objective units
identity:      experimental-default
why:           在保持自由图的同时，优先去掉最妨碍追线的交叉、浅角叠线和穿字
affects:       节点局部让位、剩余交叉位置和直线可追踪性
does NOT affect: 边类型、方向或玩家获得信息的顺序
status:        experimental
reopen when:   数值变好但真人读图更差，或局部优化为避线制造更长的支持边

## layout.soft-stability

id:            layout.soft-stability
value & unit:  mobility new 1 / changed 0.78 / neighbour 0.50 / remote 0.22; anchors 0.004 / 0.012 / 0.030
identity:      experimental-default
why:           新关系附近允许整理，远端只软锚；避免按出现时间永久固化坏布局
affects:       每次行动后旧节点位移与新局部结构的整理空间
does NOT affect: DEC-032、原入口的硬钉行为或历史回放数据
status:        experimental
reopen when:   玩家在相邻两步之间认不回旧簇，或软锚妨碍明显更好的局部布局

## layout.label-rounding-safety

id:            layout.label-rounding-safety
value & unit:  0.5px additional separation; layout-probe-v1 old value 0px
identity:      experimental-default
why:           两位小数坐标在真实窄中栏会把刚好分开的矩形舍入回不足 0.01px 的接触
affects:       标签最终实际留白；不会减少碰撞盒尺寸
does NOT affect: 测试容差、文字换行、节点语义或连线关系
status:        experimental
reopen when:   坐标不再量化到两位小数，或渲染器改为浏览器实测文字包围盒

Calibration note: 尝试 `collisionPasses 180 → 360` 后同一接触仍存在，说明原因是输出舍入而非迭代不足；已回退为 180。若 0.5px 造成不必要位移，回滚到 0 并改为输出后再做一次实际矩形分离。
