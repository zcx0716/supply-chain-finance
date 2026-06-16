# 供应链金融系统 - Java 后端

## 技术栈

- Spring Boot 3.2.0
- Spring Data JPA
- H2 Database (开发环境) / MySQL (生产环境)
- Apache POI (Word文档生成)
- Lombok
- Maven

## 快速开始

### 前置条件

- JDK 17+
- Maven 3.8+

### 运行项目

```bash
# 进入后端目录
cd backend

# 编译项目
mvn clean install

# 运行项目
mvn spring-boot:run
```

或者直接运行主类：

```bash
# 编译
mvn clean package

# 运行 JAR
java -jar target/supply-chain-finance-1.0.0.jar
```

## API 文档

服务将在 `http://localhost:8080` 启动

### 客户管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/customers | 获取所有客户 |
| GET | /api/customers/{id} | 获取单个客户 |
| POST | /api/customers | 创建客户 |
| PUT | /api/customers/{id} | 更新客户 |
| DELETE | /api/customers/{id} | 删除客户 |

### 订单管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/orders | 获取所有订单 |
| GET | /api/orders/{id} | 获取单个订单 |
| GET | /api/orders/{id}/payment-plans | 获取订单的付款计划 |
| POST | /api/orders | 创建订单 |
| PUT | /api/orders/{id} | 更新订单 |
| DELETE | /api/orders/{id} | 删除订单 |

### 资金计划管理

| 方法 | 路径 | 描述 |
|------|------|------|
| PUT | /api/payment-plans/receivable/{planId}/installments/{installmentId} | 更新应收分期状态 |
| PUT | /api/payment-plans/payable/{planId}/installments/{installmentId} | 更新应付分期状态 |

### 合同管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/contracts/order/{orderId} | 获取订单的合同列表 |
| GET | /api/contracts/{id} | 获取单个合同 |
| GET | /api/contracts/{id}/download | 下载合同 |
| POST | /api/contracts | 创建合同 |

## 项目结构

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/scm/
│   │   │   ├── config/          # 配置类
│   │   │   ├── controller/      # API控制器
│   │   │   ├── dto/             # 数据传输对象
│   │   │   ├── entity/          # JPA实体
│   │   │   ├── repository/      # 数据访问层
│   │   │   ├── service/         # 业务逻辑层
│   │   │   └── SupplyChainFinanceApplication.java
│   │   └── resources/
│   │       └── application.properties
└── pom.xml
```

## 数据库配置

### H2 开发数据库

H2 控制台地址：http://localhost:8080/h2-console

连接信息：
- JDBC URL: `jdbc:h2:mem:scmdb`
- 用户名: `sa`
- 密码: (留空)

### MySQL 生产数据库

修改 `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scm_db
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=your_username
spring.datasource.password=your_password

spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

## 数据初始化

首次启动时会自动初始化5个示例客户数据用于测试。
