# 示例：TDD 开发一个工具函数

## 需求
`sum([1,2,3])` 返回 `6`，空数组返回 `0`。

## RED
创建测试：`src/lib/sum.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { sum } from './sum';

describe('sum', () => {
  it('sums an array of numbers', () => {
    expect(sum([1, 2, 3])).toBe(6);
  });

  it('returns 0 for empty array', () => {
    expect(sum([])).toBe(0);
  });
});
```
运行：`npm test -- src/lib/sum.test.ts`
应当失败：`sum` 未实现

## GREEN
实现：`src/lib/sum.ts`
```ts
export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
```
运行：`npm test -- src/lib/sum.test.ts` 通过

## REFACTOR
无