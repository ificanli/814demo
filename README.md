# 莓风群岛

一个以“堆叠大陆轻度化微创新”为目标的 HTML 拖拽堆叠卡牌原型。

当前主方向是：保留拖拽堆叠、村民采集、配方发现、卡包扩张和桌面整理乐趣，同时缩短单局、减少配方负担、降低生存惩罚。

新版主入口是 `fun.html`：玩家在木桌上拖动卡牌互相堆叠，发现配方，并围绕地图特殊商人的订单解锁能力。节庆莓塔降级为商人订单物，不再是唯一主目标。旧的七天订单版仍保留为规则实验入口。

## 当前状态

项目正在从设计阶段推进到可玩垂直切片。实现范围和最新验证结果见 [`PROGRESS.md`](PROGRESS.md)。

- 新主方向：[`TABLETOP_REDESIGN.md`](TABLETOP_REDESIGN.md)
- 核心设计与决策：[`GAME_DESIGN.md`](GAME_DESIGN.md)
- 验收与测试计划：[`TEST_PLAN.md`](TEST_PLAN.md)
- 开发进度：[`PROGRESS.md`](PROGRESS.md)
- 后续路线与自主迭代：[`ROADMAP.md`](ROADMAP.md)

## 运行

推荐先体验新的堆叠实验版：

```text
npm run serve
```

然后打开：`http://127.0.0.1:8140/fun.html`

旧的七天订单版仍保留在：`http://127.0.0.1:8140/index.html`

不需要构建工具。也可直接双击 `index.html` 或 `fun.html`，或使用任意静态文件服务器打开项目目录。

```text
index.html
styles.css
game.js
```

正式验收推荐使用静态服务器，以避免浏览器对 `file://` 页面的额外限制。

### 一键 Node 自动化

本机已加入无需 Python 的 Node 自动化脚本，覆盖语法检查、核心规则检查和 PC 七天完整跑局：

```text
npm test
```

等价底层命令：

```text
node automation/run.js
```

本地体验可启动静态服务器：

```text
npm run serve
```

然后打开：`http://127.0.0.1:8140/index.html`

当前验证结果：`OK: 10 checks passed.`，自动跑局完成 Day 1 到 Day 7，最终航程价值 `166`，三星完成。

### 无自动化桥时的规则测试

若 Jcode 浏览器桥不可用，可直接在任意现代浏览器打开 `tests.html`。页面会加载独立游戏实例并自动运行确定性规则检查，也可点击“运行全部测试”再次执行。完整手动验收流程见 [`TEST_PLAN.md`](TEST_PLAN.md)。

### Python Playwright 自动化

项目也包含独立于 Jcode 浏览器桥的 Python Playwright 验收脚本。请在可正常启动 Python 和浏览器进程的机器或 CI 中执行：

```text
py -m pip install -r automation/requirements.txt
py -m playwright install firefox
py -m pytest automation/test_browser.py
```

它会运行规则套件，并验证玩家页面的 Day 1 初始状态。

## 核心操作

- 点击两件同级货物进行二合，也可使用拖拽交互。
- 调整岛屿顺序改变航线结构。
- 勾选订单后，订单会优先消耗货物并提供奖励。
- 查看收益预测，再主动点击“收工”推进一天。
- Day 1 至 Day 6 的收益变为本局金币，Day 7 单次最终启航决定星级。

## 设计原则

- 无实时倒计时，不通过挂机或重复拖动产生收益。
- 收工预测与实际结果使用同一套计算规则。
- 订单货物不参与同一次装船基础价值，保留真实取舍。
- 空间拥堵不会导致不可恢复的软锁。
- 核心操作提供点击替代，不强制依赖精确拖拽。

## 技术范围

- 原生 HTML、CSS、JavaScript。
- 无框架、无外部运行时依赖。
- 当前目标是单机浏览器垂直切片，不包含账号、联网、付费或正式元养成。
