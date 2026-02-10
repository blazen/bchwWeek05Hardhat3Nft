# Hardhat NFT

## 功能
- 创建拍卖：	允许用户将 NFT 上架拍卖。
- 出价：		允许用户以 ERC20 或以太坊出价。汇率通过 chainlink 实时查询。
- 结束拍卖：	
- 拍卖成功：NFT 转移给出价最高者，资金在扣去手续费后转移给卖家，未中标的竞标自己提取资金。
- 拍卖流标：NFT 转移给拍卖者。

## 实现点
- 1.继承 Initializable + ignition TransparentUpgradeableProxy 实现透明代理合约的部署和升级。
- 2.继承 UUPSUpgradeable 方便以后支持 openzeppelin-upgrade hardhat 插件。
- 3.继承 OwnableUpgradeable 使用 onlyOwner 限制函数只能管理员访问。
- 4.支持配置 ERC20 TOKEN 合约的 FEED 地址。方便卖家可以使用期望的代币。
- 5.继承 ReentrancyGuardUpgradeable 使用 nonReentrant 防止函数重入。

## 遇到的问题
- 1.使用代理后，在 REMIX 中无法看到事件。
- 2.ERC1967Utils 存储变量，所以升级合约中新定义的变量才能成功。
- 3.REMIX DESKTOP 在 METAMASK 切换网络后，不会自动切换，REMIX 浏览器亦是如此。且始终显示连接到主网 OP。
- 4.npm 包怎么看依赖的版本限制，在 https://www.npmjs.com/ 上只能看到有哪些依赖，不显示依赖的版本要求。
- 5.TS 怎么查看具体的返回结构体呢，比如 const { ethers } = await network.connect();
- 6.这是什么路径，是 hardhat2的么？hardhat3 现在的路径：../types
  - ../typechain-types/contracts
- 7.REMIX 显示的问题的数据精度存在丢失现象。
- 8.metamask 为何没有代币授权这个功能？
- 9.部署使用 --verify 时 Etherscan，Blockscout，Sourcify 三个中只有 Sourcify 成功返回地址。

  ![`Remix`演示](./imgs/部署成功验证失败.png)
- 10.部署ignition警告
  ![`Remix`演示](./imgs/部署ignition警告.png)
- 11.分析函数 GAS 消耗情况，并能够给出优化方案的工具呢？

## 环境要求
- Node.js >= 22.0.0
- Hardhat ^3.1.6

## 项目结构

- 项目初始化：npx hardhat --init

```
bchwWeek05Hardhat3Nft/
├── contracts/oz/               # 智能合约源码
│   ├── OpzNFT.sol              # NFT
│   ├── OpzToken.sol            # TOKEN
│   ├── OpzNFTAuction.sol       # 拍卖合约
│   ├── OpzNFTAuction.t.sol     # 拍卖合约 solidity 测试
│   ├── OpzNFTAuctionV1.sol     # 拍卖合约V1：测试合约版本函数升级
│   ├── OpzNFTAuctionV2.sol     # 拍卖合约V2：chainlink 实时查询 ETH\USDC TO USD 的汇率。
│   └── OpzNFTAuctionV3.sol     # 拍卖合约V3：1.增加动态配置 chailink 汇率；2.创建拍卖时，验证 NFT 是否已经授权，并转移到拍卖合约中；3.在拍卖后，计算手续费。从拍卖者收益中减去。
├── ignition/                   # Hardhat Ignition 声明式部署模块
│   └── modules/
│       ├── OpzNFT.ts                       # NFT 部署
│       ├── OpzToken.ts                     # TOKEN 部署
│       ├── OpzNFTAuction.ts                # 拍卖合约部署
│       ├── OpzNFTAuctionUpgrade.ts         # 拍卖合约V1部署
│       ├── OpzNFTAuctionUpgradeV2.ts       # 拍卖合约V2部署
│       └── OpzNFTAuctionUpgradeV3.ts       # 拍卖合约V3部署
├── test/                       # 基于 Chai 的完整测试集
│   └── OpzNFTAuctionTest.ts    # 拍卖合约测试
├── .env                        # dotenv 环境变量配置文件（进本地，不上传到仓库）
├── hardhat.config.ts           # Hardhat 配置
├── package.json                # 脚本与依赖管理
└── tsconfig.json               # TypeSciprt 配置
```

## 安装与编译

- TIPS：
- 1.目前 sepolia 已经升级到 V3。

```bash
# 1. 克隆并进入目录
# 2. 安装依赖
npm install

# 3. 编译合约
npm run compile

# 4. 测试拍卖合约
npm run test:auction:coverage

# 5. 测试拍卖合约，并生成 coverage-report.txt
npm run test:auction:coverage:report

# 6. 查看拍卖合约GAS
npm run test:auction:gas

# 7. 查看拍卖合约GAS，并生成 gas-report.txt
npm run test:auction:gas:report

# 8. 部署
npm run deploy:local
npm run deploy:sepolia

# 8. 升级V1
npm run deploy:upgrade:local
npm run deploy:upgrade:sepolia
```

## 测试结果
### 1.拍卖合约测试用例全部通过

![`Remix`演示](./imgs/测试用例通过.png)

### 2.拍卖合约测试覆盖率 97
![`Remix`演示](./imgs/测试覆盖率.png)

### 3.拍卖合约部署到 sepolia 成功
```bash
Deployed Addresses

OpzNFTModule#OpzNFT - 0x687a98f8F12AF778cc0f27c119de3c03eb8AFa3C
OpzTokenModule#OpzToken - 0x9bbAfb68acc3C2811e69509Eb73d678BAAc7007f
OpzNFTAuctionProxyModule#OpzNFTAuction - 0xD0fdAdd88D1cc3dAcA0B3197dAD453d493bEd8dD
OpzNFTAuctionProxyModule#TransparentUpgradeableProxy - 0xBDd0ae6A19E0A5D4e277A6d9200aCd97c3c3DA98
OpzNFTAuctionProxyModule#ProxyAdmin - 0xaAAFD9c16bfa7E11f3b2d4C5bc755C1F4C270394
OpzNFTAuctionModule#OpzNFTAuction - 0xBDd0ae6A19E0A5D4e277A6d9200aCd97c3c3DA98
OpzNFTAuctionUpgradeModule#OpzNFTAuctionV1 - 0xf66F7A0FCc689CDE5eEf4FAC41F2Fee39074A76a
OpzNFTAuctionUpgradeModule#OpzNFTAuctionV1AtProxy - 0xBDd0ae6A19E0A5D4e277A6d9200aCd97c3c3DA98
OpzNFTAuctionUpgradeV2Module#OpzNFTAuctionV2 - 0x7982B305E5376D5A6CeDeE0B0bB1532E6b9bDC09
OpzNFTAuctionUpgradeV2Module#OpzNFTAuctionV2AtProxy - 0xBDd0ae6A19E0A5D4e277A6d9200aCd97c3c3DA98
```

### 4.REMIX 测试 SEPOLIA 合约功能

### 测试步骤：
- 1.测试号、额度准备
  - account1：作为 owner 部署合约， 作为拍卖者
  - account2：竞标者，使用 USDC 竞拍，流标。当前持有 20 USDC。		
  - account3：竞标者，使用 ETH 竞拍，中标

- 2.根据账号 ETH\USDC 额度，估算起拍价
  - ETH，0.005，10$，0.001ETH，1000000000000000，18个0
  - USDC，20，20$，1USDC，1100000，6个0
  - NFT 测试起拍价格 1$

- 3.切换到 owner/account1
  - 1.给 account1 铸造一个 NFT 1
  - 2.NFT 1 授权函数给拍卖合约授权
  - 3.调用 start 创建拍卖

- 4.切换到 account2
  - 给拍卖合约授权 1000000 TOKEN
  - 调用 bid 竞标 0，使用 TOKEN 竞标失败，不足最低价
  - 给拍卖合约授权改为 1100000 TOKEN
  - 调用 bid 竞标 0，使用 TOKEN 竞标成功
  - 验证：
    - 到 TOKEN 合约分别查看拍卖合约、账户2的 TOKEN 余额，拍卖合约：1100000，账户2：18900000

- 5.切换到 account3
  - 调用 bid 竞标，使用 10Finney 竞标成功

- 6.取款
  - 切换到账户1，拍卖者取款，成功，余额增加10Finney
  - 切换到账户2，流标取款，成功，余额变为20USDC
  - 切换到账户3，中标取NFT，成功，NFT所属变更为账户3


### 测试步骤截图：
### 1.1NFT1铸造成功

![`Remix`演示](./imgs/1.1NFT1铸造成功.png)

### 1.2NFT1授权合约成功

![`Remix`演示](./imgs/1.2NFT1授权合约成功.png)

### 1.3拍卖创建成功

![`Remix`演示](./imgs/1.3拍卖创建成功.png)

### 2.1账户2授权USDC到拍卖合约成功

![`Remix`演示](./imgs/2.1账户2授权USDC到拍卖合约成功.png)

### 2.2测试竞标失败

![`Remix`演示](./imgs/2.2测试竞标失败.png)

### 2.3.1竞标成功

![`Remix`演示](./imgs/2.3.1竞标成功.png)

### 2.3.2竞标成功

![`Remix`演示](./imgs/2.3.2竞标成功.png)

### 3.1账号3 ETH竞标成功

![`Remix`演示](./imgs/3.1账号3ETH竞标成功.png)

### 4.1账号3取款：拍卖未结束，无法取款

![`Remix`演示](./imgs/4.1账号3取款：拍卖未结束，无法取款.png)

### 4.2账号1取款成功：余额增加10Finney

![`Remix`演示](./imgs/4.2账号1取款成功：余额增加10Finney.png)

### 4.3账号2取款成功：余额变为20USDC

![`Remix`演示](./imgs/4.3账号2取款成功：余额变为20USDC.png)

### 4.4账号3取款：NFT所属变更

![`Remix`演示](./imgs/4.4账号3取款：NFT所属变更.png)

### 5合约升级成功

![`Remix`演示](./imgs/5合约升级成功.png)

### 6合约V3升级成功

![`Remix`演示](./imgs/6合约V3升级成功.png)


## TIPS
- 1.@openzeppelin/hardhat-upgrades 不支持 hardhat3
  - 安装包时，@openzeppelin/hardhat-upgrades@3.9.1 支持 @nomicfoundation/hardhat-ethers@"^3.0.6，但是本地为 @nomicfoundation/hardhat-ethers@4.0.4
  - 所以无法使用 hardhat-upgrades 部署升级。网上查找，给出的都是 hardhat2 的写法。
  - 本次使用的是 hardhat3 官方文档示例中的 TransparentUpgradeableProxy
  - 截至到当前依然是 3.9.1 版本
    ![`Remix`演示](./imgs/openzeppelin-upgrade-v3.9.1.png)

- 2.hardhat-gas-reporter 不支持 hardhat3
  - hardhat@"^2.16.0" from hardhat-gas-reporter@2.3.0


## 参照
- hardhat3 https://hardhat.org/docs/getting-started
- hardhat3 ignition upgrade https://hardhat.org/ignition/docs/guides/upgradeable-proxies
- hardhat3 官方插件 https://hardhat.org/docs/plugins/official-plugins#hardhat-ethers
- hardhat3 社区插件 https://hardhat.org/docs/plugins/community-plugins
- openzeppelin 代理介绍 https://www.openzeppelin.com/news/proxy-patterns
- openzeppelin 代理几种说明 https://docs.openzeppelin.com/contracts/5.x/api/proxy
- openzeppelin 代理模式介绍 https://docs.openzeppelin.com/upgrades-plugins/proxies
- openzeppelin 代理升级 hardhat 插件 https://docs.openzeppelin.com/upgrades-plugins/hardhat-upgrades
- mocha https://mochajs.org/getting-started/
- chai https://www.chaijs.com/api/bdd/