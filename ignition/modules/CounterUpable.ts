import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const counterUpableProxyModule = buildModule("CounterUpableProxyModule", (m) => {
    // 代理升级管理员
    const proxyAdminOwner = m.getAccount(0);
    // deploy logic
    const counter = m.contract("CounterUpable");
    // initialize
    const encodedFunctionCall = m.encodeFunctionCall(
        counter,
        "initialize",
        [10],
    );
    // deploy proxy
    const proxy = m.contract("TransparentUpgradeableProxy", [
        counter,
        proxyAdminOwner,
        encodedFunctionCall,
    ]);
    // 取得透明代理管理员变更事件中的新管理员地址
    const proxyAdminAddress = m.readEventArgument(
        proxy,
        "AdminChanged",
        "newAdmin",
    );
    // 告诉 ProxyAdmin 合约使用 proxyAdminAddress 与之交互升级
    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

    return { proxyAdmin, proxy };
});

const counterUpableModule = buildModule("CounterUpableModule", (m) => {
    const { proxyAdmin, proxy } = m.useModule(counterUpableProxyModule);

    // tell Ignition to use the Demo ABI for the contract at the address of the proxy.
    // This will allow us to interact with the Demo contract through the proxy when we use it in tests or scripts.
    const counter = m.contractAt("CounterUpable", proxy);

    // CounterUpableModule#CounterUpableProxyModule~TransparentUpgradeableProxy.getValue:
    // - HHE10708: Function 'getValue' not found in contract TransparentUpgradeableProxy
    // m.call(proxy, "getValue");
    m.call(counter, "getVersion");

    return { counter, proxyAdmin, proxy };
});


// Deployed Addresses
// CounterUpableProxyModule#CounterUpable               - 0x5FbDB2315678afecb367f032d93F642f64180aa3
// CounterUpableProxyModule#TransparentUpgradeableProxy - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// CounterUpableProxyModule#ProxyAdmin                  - 0xCafac3dD18aC6c6e92c921884f9E4176737C052c
// CounterUpableModule#CounterUpable                    - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
export default counterUpableModule;