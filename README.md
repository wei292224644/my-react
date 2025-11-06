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

1. 创建DOM实例，这里有一个优化手段，当处在mount节点时，会递归将所有的子节点中的dom都创建出来，然后只需要执行一次`Placement`即可。该`Placement`是由hostRootFiber发起（在第一次Workloop中，也就是alternate为null时，添加的`Placement`）。
2. 属性处理，为后续commit阶段准备（标记`Update`副作用）。
3. 副作用收集，将子节点的副作用归拢到自身父节点中(父节点的subtreeFlags)

## commitRoot 函数

commit阶段分为三个流程:

1. beforeMutation阶段，处理所有的副作用。执行插入、移动、删除DOM元素。
2. mutation阶段 TODO
3. layout阶段 TODO
