/*
 * Vai trò: Chuẩn hóa lỗi từ `apiFetch`.
 */
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

it.each([true, false])('explains HTTP 413 even when the response is JSON: %s', async (isJson) => {
  vi.stubEnv('VITE_API_URL', 'https://api.example/api')
  const { apiFetch } = await import('../src/services/api')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 413,
    json: async () => {
      if (!isJson) throw new SyntaxError('Not JSON')
      return { message: 'request entity too large' }
    },
  }))
  await expect(apiFetch('/products', { method: 'POST' })).rejects.toMatchObject({
    status: 413,
    message: 'Dữ liệu gửi lên vượt giới hạn máy chủ. Hãy giảm dung lượng ảnh hoặc số ảnh rồi thử lại.',
  })
})
