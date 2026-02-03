# Hardhat NFT

## 包含功能
- 创建拍卖：	允许用户将 NFT 上架拍卖。
- 出价：		允许用户以 ERC20 或以太坊出价。
- 结束拍卖：	拍卖结束后，NFT 转移给出价最高者，资金转移给卖家。

## 环境要求
- Node.js >= 22.0.0

## 项目结构
```
bchwWeek05Hardhat3Nft/
├── contracts/              # 智能合约源码
│   ├── CrowdfundingCampaign.sol    # 业务逻辑合约
│   └── CrowdfundingFactory.sol     # 工厂管理合约
├── ignition/              # Hardhat Ignition 声明式部署模块
│   └── modules/
│       └── Crowdfunding.ts # 部署逻辑定义
├── test/                   # 基于 Chai 的完整测试集
│   ├── CrowdfundingCampaign.test.ts
│   └── CrowdfundingFactory.test.ts
├── hardhat.config.ts       # Hardhat 配置
├── package.json            # 脚本与依赖管理
└── tsconfig.json           # TypeSciprt 配置
```

## 安装与编译
```bash
# 1. 克隆并进入目录
# 2. 安装依赖
npm install

# 3. 编译合约
npm run compile
```