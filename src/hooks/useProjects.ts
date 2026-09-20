import { useCallback, useEffect, useState } from 'react'
import { getProjects, type Project } from '../services/project.service'

interface UseProjectsResult {
  projects: Project[]
  isLoading: boolean
  errorMessage: string | null
  retry: () => void
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrentRequest = true

    async function loadProjects() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getProjects()
        if (isCurrentRequest) setProjects(response)
      } catch (error: unknown) {
        if (isCurrentRequest) {
          setProjects([])
          setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách dự án.')
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }

    void loadProjects()
    return () => { isCurrentRequest = false }
  }, [reloadKey])

  const retry = useCallback(() => setReloadKey((currentKey) => currentKey + 1), [])

  return { projects, isLoading, errorMessage, retry }
}
