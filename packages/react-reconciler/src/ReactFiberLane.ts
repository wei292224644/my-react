import { FiberRootNode } from './ReactFiber';

export type Lane = number;
export type Lanes = number;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000010;

export const getHighestPriorityLane = (lanes: Lanes): Lane => {
  return lanes & -lanes;
};

export const mergeLanes = (a: Lanes | Lane, b: Lanes | Lane): Lanes => {
  return a | b;
};

export const markRootFinished = (root: FiberRootNode, remainingLane: Lane) => {
  root.pendingLanes &= ~remainingLane;
};
