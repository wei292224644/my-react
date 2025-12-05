## 事件系统

在调用createRoot时，会将所有注册在allNativeEvents这个集合中，并将事件绑定在createRoot传入的element上。
并通过addEventListener中的options来确定该事件是否为capture阶段。

本项目只绑定了click事件，并且capture是通过调用事件时的顺序来执行的。

## beignWork 函数

该阶段为递归操作中的递。
主要作用有：

1. 协调算法：根据current和workInProgress两个树对比，检测props、state等是否发生变化，如果发生变化添加`Update`副作用。
2. 子节点协调：根据比较结果，决定子节点的处理策略：复用、移动(`Placement`)、插入(`Placement`)、删除(`ChildDeletion`)
3. 副作用标记
4. 性能优化（TODO）

### 协调算法

该阶段分为两种状态，mount和update。mount只会添加`Placement`副作用。
当处在update状态中，会分为一下几种情况：

1. 当多子节点变成单子节点时，需要遍历所有的子节点，如果`key相同&type相同`的话，说明该节点是可复用的节点，反之标记为`ChildDeletion`，并将其他子节点标记`ChildDeletion`。
2. 当多节点或单节点变成多节点时，创建一个哈希表来存储current树中的子节点。循环遍历新的子节点数组，并将其创建FiberNode，组合成链表形式（大概率alternate复用）。然后处理副作用，这里记录一个`lastPlacedIndex`值，用来存储current树中上一个可复用的节点索引，然后比较当前循环中的current树的fiberNode的索引是否小于`lastPlacedIndex`，因为在新的树中，每次循环获取的都会是最右边的，所以如果小于`lastPlacedIndex`的话，那么一定是需要`Placement(移动)`的节点。
   ABC->CAB C节点在current树中的index为2,那么需要移动的便是AB
   CAB->ABC C节点在current树中的index为0，那么需要移动的只有C

## completeWork 函数

该阶段为递归操作中的归。
主要作用有：

1. 创建DOM实例，这里有一个优化手段，当处在mount节点时，会递归将所有的子节点中的dom都创建出来，然后只需要执行一次`Placement`即可。该`Placement`是由hostRootFiber发起（在第一次Workloop中，也就是alternate为null时，添加的`Placement`）。这里创建出来的DOM节点并没有插入到页面中，真正插入是在commit阶段的mutation阶段完成的。
2. 属性处理，为后续commit阶段准备（标记`Update`副作用）。
3. 副作用收集，将子节点的副作用归拢到自身父节点中(父节点的subtreeFlags)

## commitRoot 函数

commit阶段分为三个流程:
这里需要注意的是，commit阶段是同步执行的。并且如果已经进入了passive阶段之后，必须等待所有的passive副作用执行完毕，才能进行下一次的commit流程。

1. beforeMutation阶段 ：
   1. 调用ClassComponent的getSnapshotBeforeUpdate生命周期函数
   2. 记录当前的焦点元素，保存selection信息
   3. Suspense snapshot
2. mutation阶段
   1. 插入、删除、更新 DOM
   2. 移除旧 ref
3. layout阶段
   1. 执行useLayoutEffect的销毁函数
   2. 调用useLayoutEffect的回调函数
   3. 调用ClassComponent的componentDidMount和componentDidUpdate生命周期函数
   4. 恢复焦点元素，恢复selection信息
4. passive阶段（异步执行）
   1. 执行useEffect的销毁函数
   2. 调用useEffect的回调函数

## useEffect

### Mount阶段

fiber添加：PassiveEffect | PassiveStaticEffect
effect添加：HookHasEffect | HookPassive

### Update阶段

fiber添加：PassiveEffect
effect添加：HookHasEffect | HookPassive （这里会判断deps是否变化，如果有变化才会添加这些flags）

## Context

Context的实现主要依赖于一个栈结构来管理不同层级的Context值。
当Provider组件渲染时，会将新的Context值推入栈中；当组件卸载时，会将对应的Context值从栈中弹出。
在函数组件中使用useContext时，会从栈顶获取当前的Context值。
这种栈结构确保了在嵌套的Provider情况下，子组件总是能够访问到最近的Context值，实现了Context的层级覆盖效果。

## Suspense 组件

Suspense组件通过协调其子组件的渲染状态来实现异步加载的占位符显示。
当Suspense的子组件处于加载状态时，Suspense会渲染一个备用的占位符内容（fallback）。
一旦子组件加载完成，Suspense会重新渲染其子组件，替换掉占位符内容。
Suspense通过Fiber树的更新机制，确保在子组件加载过程中，用户界面保持响应性，并提供良好的用户体验。

<!-- DidCapture Flag用于标记Suspense组件的子节点是否捕获到了异步加载的状态。
当子节点进入加载状态时，React会在对应的Fiber节点上设置DidCapture标记。
这个标记通知React在commit阶段需要渲染Suspense的fallback内容。
一旦子节点加载完成，React会清除这个标记，并重新渲染子节点，替换掉fallback内容。 -->

### 底层实现原理

Suspense组件会给children添加一个离屏渲染的标记（OffscreenComponent），
并且在completeWork阶段会创建一个OffscreenQueue来存储当前离屏渲染的子节点。
当子节点加载完成后，会将这些子节点从OffscreenQueue中移除，并将其插入到主渲染树中。

#### 如何处理异步

1. 定义了Thenable接口，表示一个异步操作。Thenable有四种状态：Untracked、Pending、Fulfilled、Rejected。
2. 在调度阶段会被catch到handleThrow函数中，这里会设置workInProgressSuspendedReason为SuspenseException
3. 因为调度本身是个while循环，所以会再次进入调度阶段，这个时候检测到workInProgressSuspendedReason为SuspenseException，那么会通过throwAndUnwindWorkLoop函数执行unwind操作。
4. unwind执行之前会将上方的Suspense的fiberNode的Flags添加ShouldCapture标记，表示该节点需要捕获异常，并且通过attachPingListener函数将Wakeable和lanes绑定在pingCache中,等待Wakeable状态变更时重新调度该lanes。
5. unwind是向上找到最近的Suspense组件fiberNode，并删除其ShouldCapture标记，添加DidCapture标记。
6. 等待Wakeable状态变更时重新调度该lanes，重新调度时会进入updateSuspenseComponent函数，删除DidCapture标记，然后渲染children中的内容。

## react执行一次render大致流程

1. 调用根节点的render函数，创建根FiberNode（HostRoot类型）
2. 调用调度函数scheduleUpdateOnFiber，开始调度更新，如果lane是SyncLane，则立即执行flushSyncWorkOnLegacyRootsOnly函数。
3. 执行ensureRootIsScheduled，确定更新的优先级，并调用scheduleImmediateRootScheduleTask，最后会执行到performWorkOnRoot函数。
4. 确定是否需要时间切片如果需要，执行renderRootConcurrent，否则执行renderRootSync。
5. renderRootConcurrent->performUnitOfWork，这个阶段会判断是否需要中断（shouldYield）
6. renderRootSync->workLoopSync->performUnitOfWork，这个阶段不会中断，直到所有的workInProgress都完成。
7. 执行beginWork,按照DFS的递方式进行协调和构建新的Fiber树。
8. 执行completeWork,按照DFS的归方式完成。
9. 执行完成之后会检测exitStatus，如果是RootCompleted则调用commitRootWhenReady函数。（此处在performWorkOnRoot函数中）
10. 执行commitRoot函数，进入commit阶段，分为beforeMutation、mutation、layout、passive四个子阶段。
