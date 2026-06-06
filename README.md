1. 项目定位
   Decurl 是一个专注 URL Search Params 的类型安全状态管理库。

2. 核心问题
   Search Params 的难点不是写入，而是 decode：
   string / string[] / null → typed value。

3. 与 nuqs / zod / valibot 的关系
   不是复刻 nuqs，也不是通用校验库。
   重点是 URLSearchParams 场景下的轻量解析、过滤、类型推导。

4. 包结构方向
   多包架构：
   @decurl/core
   @decurl/react-router
   @decurl/navigation

5. 当前阶段范围
   先实现 core。
   不做 hook。
   不做 router adapter。
   不做 pending flush。
   不做 React 相关逻辑。

6. core 包职责
   codec 类型
   decode pipeline
   schema 定义
   URLSearchParams decode / encode

7. 设计约束
   ESM
   TypeScript-first
   类型推导优先
   小步实现
   每步易 review

8. 未来方向，仅作为上下文
   react-router runtime
   navigation runtime
   optimistic partial update
   route search memory
