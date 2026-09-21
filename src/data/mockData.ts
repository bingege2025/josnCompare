export const MOCK_LEFT_JSON = JSON.stringify(
  {
    code: 0,
    message: 'success',
    requestId: 'req_8f12a3bc99d10e',
    timestamp: 1716201600000,
    trace: {
      traceId: 'trace-alpha-001',
      spanId: 'span-root-1',
    },
    data: {
      orderId: 9007199254740993,
      amount: 199.0,
      currency: 'CNY',
      status: 'PENDING_PAYMENT',
      couponCode: null,
      notes: '',
      isVip: false,
      items: [
        { skuId: 1001, name: '机械键盘', qty: 1, price: 129.0 },
        { skuId: 1002, name: '双模无线鼠标', qty: 1, price: 70.0 },
      ],
      user: {
        userId: 'usr_8892',
        tier: 'GOLD',
        score: 100,
      },
      legacyToken: 'old_secret_token_123',
      'sys/channel': 'wechat_app',
    },
  },
  null,
  2
);

export const MOCK_RIGHT_JSON = JSON.stringify(
  {
    code: 0,
    message: 'success',
    requestId: 'req_b72ef910a5cc33', // 噪点字段，适合一键忽略
    timestamp: 1716201655000, // 噪点字段，适合一键忽略
    trace: {
      traceId: 'trace-beta-002', // 噪点字段，适合一键忽略 /trace
      spanId: 'span-root-2',
    },
    data: {
      orderId: 9007199254740993, // 超大长整数，相同数值，不误判
      amount: 199, // 199.0 与 199 数值相同，不报差异
      currency: 'CNY',
      status: 'PAID', // 值变化 (value_changed)
      couponCode: 'SPRING_DISCOUNT_20', // 类型变化 null -> string (type_changed)
      notes: '', // 空字符串保持相同
      isVip: 0, // 0 与 false 严格区分类型变化 (type_changed)
      items: [
        { skuId: 1001, name: '机械键盘', qty: 2, price: 129 }, // qty 值变化 1 -> 2
        { skuId: 1002, name: '双模无线鼠标', qty: 1, price: 70 },
        { skuId: 1003, name: '键盘定制掌托', qty: 1, price: 39 }, // 数组新增项 (added)
      ],
      user: {
        userId: 'usr_8892',
        tier: 'DIAMOND', // 值变化 GOLD -> DIAMOND
        score: '100', // 类型变化 number -> string (type_changed)
      },
      // legacyToken 已删除 (removed)
      featureFlags: {
        // 新增复杂对象 (added)
        fastDelivery: true,
        giftWrap: false,
      },
      'sys/channel': 'wechat_app', // 特殊路径相同
    },
  },
  null,
  2
);
