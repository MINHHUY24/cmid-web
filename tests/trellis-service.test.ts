/*
 * Vai trò: API TRELLIS tạo/poll/lưu/hủy model 3D.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

const id = '48b2cdfdda284f81b4a68c888cca1c30'
const modelPath = `/jobs/${id}/model`
const savedPath = `/models/generated/${id}.glb`

describe.each([
  { name: 'local proxy', base: '', apiBase: '/trellis-api', assetBase: '' },
  { name: 'remote API', base: ' https://trellis.example/ ', apiBase: 'https://trellis.example', assetBase: 'https://trellis.example' },
  { name: 'remote proxy', base: 'https://cmid.example/trellis-api', apiBase: 'https://cmid.example/trellis-api', assetBase: 'https://cmid.example/trellis-api' },
])('$name', ({ base, apiBase, assetBase }) => {
  async function service(payload: unknown) {
    vi.resetModules()
    vi.stubEnv('VITE_TRELLIS_API_URL', base)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload })
    vi.stubGlobal('fetch', fetchMock)
    return { ...await import('../src/services/trellis.service'), fetchMock }
  }

  it.each([modelPath, `/trellis-api${modelPath}`])('resolves preview %s using the API base exactly once', async (previewUrl) => {
    const { getTrellisJob, fetchMock } = await service({ id, state: 'completed', previewUrl, savedUrl: savedPath })
    const job = await getTrellisJob(id)
    expect(fetchMock).toHaveBeenCalledWith(`${apiBase}/jobs/${id}`, expect.any(Object))
    expect(job.previewUrl).toBe(`${apiBase}${modelPath}`)
    expect(job.savedUrl).toBe(`${assetBase}${savedPath}`)
  })

  it('keeps absolute URLs and unavailable previews intact', async () => {
    const absoluteUrl = `https://assets.example${modelPath}?token=example`
    const { getTrellisJob, fetchMock } = await service({ previewUrl: absoluteUrl, savedUrl: absoluteUrl })
    expect(await getTrellisJob(id)).toMatchObject({ previewUrl: absoluteUrl, savedUrl: absoluteUrl })
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ previewUrl: null, savedUrl: null }) })
    expect(await getTrellisJob(id)).toMatchObject({ previewUrl: null, savedUrl: null })
  })

  it('resolves the saved model without adding the local API prefix', async () => {
    const { saveTrellisModel, fetchMock } = await service({ modelUrl: savedPath, fileName: 'model.glb', fileSize: 2048 })
    expect(await saveTrellisModel(id)).toMatchObject({ modelUrl: `${assetBase}${savedPath}` })
    expect(fetchMock).toHaveBeenCalledWith(`${apiBase}/jobs/${id}/save`, expect.objectContaining({ method: 'POST' }))
  })
})
