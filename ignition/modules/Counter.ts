import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// npx hardhat ignition deploy ./ignition/modules/Counter.ts  --network sepolia --verify
export default buildModule("CounterModule", (m) => {
  const counter = m.contract("Counter");

  m.call(counter, "incBy", [5n]);

  return { counter };
});
