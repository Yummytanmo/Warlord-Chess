import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 清理每个测试后的DOM
afterEach(() => {
  cleanup();
});

// 扩展expect匹配器
expect.extend({
  // 可以在这里添加自定义匹配器
});