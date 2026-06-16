# 供应链金融管理系统 - 项目总览

## 项目架构

```
供应链金融/
├── backend/                          # Java Spring Boot 后端
│   ├── src/main/java/com/scm/
│   │   ├── config/                   # 配置类
│   │   │   └── DataInitializer.java # 数据初始化
│   │   ├── controller/               # API 控制器
│   │   │   ├── CustomerController.java
│   │   │   ├── OrderController.java
│   │   │   ├── PaymentPlanController.java
│   │   │   └── ContractController.java
│   │   ├── dto/                      # 数据传输对象
│   │   │   ├── CustomerDTO.java
│   │   │   ├── OrderDTO.java
│   │   │   ├── UpstreamNodeDTO.java
│   │   │   ├── DownstreamNodeDTO.java
│   │   │   ├── PaymentPlanDTO.java
│   │   │   └── InstallmentDTO.java
│   │   ├── entity/                   # JPA 实体
│   │   │   ├── Customer.java
│   │   │   ├── Order.java
│   │   │   ├── UpstreamNode.java
│   │   │   ├── DownstreamNode.java
│   │   │   ├── PaymentInstallment.java
│   │   │   ├── ReceivablePlan.java
│   │   │   ├── PayablePlan.java
│   │   │   └── Contract.java
│   │   ├── repository/               # 数据访问层
│   │   │   └── *Repository.java
│   │   ├── service/                  # 业务逻辑层
│   │   │   ├── CustomerService.java
│   │   │   ├── OrderService.java
│   │   │   ├── PaymentPlanService.java
│   │   │   └── ContractService.java
│   │   └── SupplyChainFinanceApplication.java
│   ├── src/main/resources/
│   │   └── application.properties    # 配置文件
│   ├── pom.xml                       # Maven 依赖
│   └── README.md
│
├── src/                               # React + TypeScript 前端
│   ├── api/
│   │   └── client.ts                 # API 调用客户端
│   ├── hooks/
│   │   └── useApi.ts                 # API 状态管理 hooks
│   ├── pages/
│   │   └── * (需要更新以使用后端 API)
│   └── ... (其他现有文件)
│
└── 其他现有文件
```

## 核心业务逻辑

### 订单模型
- **主体企业**：每个订单一个主体
- **上游供应商**：可多个，支持层级关系
- **下游客户**：可多个
- **应收金额**：下游 → 主体
- **应付金额**：主体 → 上游

### 资金计划
- **应收计划（Receivable）**：从下游客户回款到主体
  - 自动生成分期（小额多笔）
  - 每笔不超过 50 万
- **应付计划（Payable）**：从主体付款给上游供应商
  - 自动生成分期
  - 错开应收计划时间

### 合同管理
- 基于订单数据生成 Word 文档
- 支持下载
- 可使用自定义模板

## 快速启动

### 1. 启动后端
```bash
cd backend

# 编译项目（需要 Maven 和 JDK 17+）
mvn clean install

# 运行服务
mvn spring-boot:run
```
后端将在 http://localhost:8080 启动

### 2. 启动前端（另一个终端）
```bash
# 在项目根目录
npm install
npm run dev
```
前端将在 http://localhost:5173 启动

### 3. H2 数据库控制台
访问 http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:scmdb`
- 用户名: `sa`
- 密码: (留空)

## API 接口

### 客户管理
- `GET /api/customers` - 获取所有客户
- `POST /api/customers` - 创建客户
- `PUT /api/customers/{id}` - 更新客户
- `DELETE /api/customers/{id}` - 删除客户

### 订单管理
- `GET /api/orders` - 获取所有订单
- `GET /api/orders/{id}` - 获取单个订单
- `GET /api/orders/{id}/payment-plans` - 获取订单资金计划
- `POST /api/orders` - 创建订单
- `PUT /api/orders/{id}` - 更新订单
- `DELETE /api/orders/{id}` - 删除订单

### 资金计划
- `PUT /api/payment-plans/receivable/{planId}/installments/{installmentId}` - 更新应收分期
- `PUT /api/payment-plans/payable/{planId}/installments/{installmentId}` - 更新应付分期

### 合同管理
- `GET /api/contracts/order/{orderId}` - 获取订单的合同
- `POST /api/contracts` - 创建合同
- `GET /api/contracts/{id}/download` - 下载合同

## 数据初始化

首次启动后端时，系统会自动创建 5 个示例客户：
1. 北京主体企业有限公司
2. 上海供应商A
3. 深圳供应商B
4. 广州客户A
5. 杭州客户B

## 待完善事项

1. **前端页面更新**：
   - Orders.tsx - 集成后端 API
   - Payments.tsx - 集成后端 API
   - PaymentManagement.tsx - 集成后端 API
   - Contracts.tsx - 集成后端 API
   - Dashboard.tsx - 集成后端 API

2. **认证/授权**：当前无认证

3. **数据库迁移**：生产环境建议使用 MySQL/PostgreSQL

4. **错误处理**：完善前端错误提示
