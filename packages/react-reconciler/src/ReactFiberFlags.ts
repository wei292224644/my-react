export type FiberFlags = number;

export const NoFlags = /*                      */ 0b0000000000000000000000000000000;
export const Placement = /*                    */ 0b0000000000000000000000000000010;

// You can change the rest (and add more).
export const Update = /*                       */ 0b0000000000000000000000000000100;

export const ChildDeletion = /*                */ 0b0000000000000000000000000010000;
/* Used by DidCapture:                            0b0000000000000000000000010000000; */

export const Passive = /*                      */ 0b0000000000000000000100000000000;
/* Used by Hydrating:                             0b0000000000000000001000000000000; */

export const MutationMask = Placement | Update | ChildDeletion;

export const PassiveMask = Passive | ChildDeletion;
