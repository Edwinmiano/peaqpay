// Mock SDK
jest.mock('@peaq-network/sdk', () => ({
  Sdk: {
    createInstance: jest.fn().mockResolvedValue({
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      token: {
        transfer: jest.fn().mockResolvedValue({ hash: 'test-hash' })
      },
      getTransaction: jest.fn().mockResolvedValue({
        signature: 'test-hash',
        confirmed: true,
        blockNumber: 12345
      })
    })
  }
}));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test')
}));
