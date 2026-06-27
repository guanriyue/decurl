# 显式 Pipeline

Decode pipeline 应该把每一步选择写出来。

推荐：

```ts
pipe(trim, shape.integer, toNumber, min(1))
```

不推荐在 Decurl 中提供：

```ts
parseAsPositiveInteger()
```

原因是成品 parser 会把多个策略打包在一起。维护者阅读代码时，需要猜测函数内部是否 trim、如何处理非法值、是否接受宽松数字格式、是否有 fallback。

业务项目可以基于小组件封装自己的成品函数：

```ts
const positiveInteger = pipe(trim, shape.integer, toNumber, min(1))
```

这种封装属于业务上下文，风险小于 Decurl 提供通用成品 parser。

添加 decode primitive 的具体规则见 [Decode Primitives 维护准则](../architecture/decode-primitives.md)。
