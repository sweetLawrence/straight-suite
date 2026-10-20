// import { check } from '@tauri-apps/plugin-updater'
// import { relaunch } from '@tauri-apps/plugin-process'
// import { notifications } from '@mantine/notifications'

// export async function checkForUpdates() {
//   try {
//     const update = await check()

//     // No update — silently continue
//     if (!update) {
//       return
//     }

//     notifications.show({
//       title: 'Update available',
//       message: `Straight OS ${update.version} is available. Downloading and installing...`,
//       autoClose: false,
//     })

//     await update.downloadAndInstall()

//     notifications.show({
//       title: 'Update installed',
//       message: 'Straight OS will restart to finish the update.',
//       autoClose: 2000,
//     })

//     await relaunch()
//   } catch (error) {
//     // Silent failure in production.
//     // An update check should never prevent the app from starting.
//     console.error('Update check failed:', error)
//   }
// }































import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export type UpdateState =
  | 'checking'
  | 'downloading'
  | 'installing'
  | 'complete'
  | 'error'
  | 'idle'

export interface UpdateProgress {
  state: UpdateState
  version?: string
  downloaded: number
  total: number
  percentage: number
}

export async function checkForUpdates(
  onProgress: (progress: UpdateProgress) => void
) {
  try {
    onProgress({
      state: 'checking',
      downloaded: 0,
      total: 0,
      percentage: 0
    })

    const update = await check()

    if (!update) {
      onProgress({
        state: 'idle',
        downloaded: 0,
        total: 0,
        percentage: 0
      })

      return
    }

    const version = update.version

    let downloaded = 0
    let total = 0

    onProgress({
      state: 'downloading',
      version,
      downloaded: 0,
      total: 0,
      percentage: 0
    })

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started': {
          total = event.data.contentLength ?? 0
          downloaded = 0

          onProgress({
            state: 'downloading',
            version,
            downloaded,
            total,
            percentage: 0
          })

          break
        }

        case 'Progress': {
          downloaded += event.data.chunkLength

          const percentage =
            total > 0
              ? Math.min(100, Math.round((downloaded / total) * 100))
              : 0

          onProgress({
            state: 'downloading',
            version,
            downloaded,
            total,
            percentage
          })

          break
        }

        case 'Finished': {
          onProgress({
            state: 'installing',
            version,
            downloaded: total,
            total,
            percentage: 100
          })

          break
        }
      }
    })

    onProgress({
      state: 'complete',
      version,
      downloaded: total,
      total,
      percentage: 100
    })

    await relaunch()
  } catch (error) {
    console.error('Update check failed:', error)

    onProgress({
      state: 'error',
      downloaded: 0,
      total: 0,
      percentage: 0
    })
  }
}