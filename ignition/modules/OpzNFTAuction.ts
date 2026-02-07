import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// npx hardhat ignition deploy ./ignition/modules/OpzNFTAuction.ts
const opzNFTAuctionProxyModule = buildModule("OpzNFTAuctionProxyModule", (m) => {
    // 代理升级管理员
    const proxyAdminOwner = m.getAccount(0);
    // deploy logic
    const auction = m.contract("OpzNFTAuction");
    // initialize
    const encodedFunctionCall = m.encodeFunctionCall(
        auction,
        "initialize",
        [],
    );
    // deploy proxy
    const proxy = m.contract("TransparentUpgradeableProxy", [
        auction,
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

const opzNFTAuctionModule = buildModule("OpzNFTAuctionModule", (m) => {
    const { proxyAdmin, proxy } = m.useModule(opzNFTAuctionProxyModule);

    // tell Ignition to use the Demo ABI for the contract at the address of the proxy.
    // This will allow us to interact with the Demo contract through the proxy when we use it in tests or scripts.
    const auction = m.contractAt("OpzNFTAuction", proxy);

    // CounterUpableModule#CounterUpableProxyModule~TransparentUpgradeableProxy.getValue:
    // - HHE10708: Function 'getValue' not found in contract TransparentUpgradeableProxy
    // m.call(proxy, "getValue");
    m.call(auction, "getVersion");

    return { auction, proxyAdmin, proxy };
});


// Deployed Addresses
// OpzNFTAuctionProxyModule#OpzNFTAuction - 0x5FbDB2315678afecb367f032d93F642f64180aa3
// OpzNFTAuctionProxyModule#TransparentUpgradeableProxy - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// OpzNFTAuctionProxyModule#ProxyAdmin - 0xCafac3dD18aC6c6e92c921884f9E4176737C052c
// OpzNFTAuctionModule#OpzNFTAuction - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
export default opzNFTAuctionModule;