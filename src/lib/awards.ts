export const managerAwardIds = ["bedKeeper", "workdayStar", "welcomeNeighbor", "harvestHand"] as const;
export type ManagerAwardId = (typeof managerAwardIds)[number];

export function isManagerAward(value: string): value is ManagerAwardId {
  return (managerAwardIds as readonly string[]).includes(value);
}
