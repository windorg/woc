import PgBoss from 'pg-boss'
import { beeminderSyncCard, BeeminderSyncCardPayload } from './jobs/beeminder-sync-card'
import { error } from 'console'

type Job = {
  tag: 'beeminder-sync-card'
  payload: BeeminderSyncCardPayload
}

const boss = new PgBoss(process.env.DATABASE_URL!)

export async function addJob<T extends Job['tag']>(
  tag: T,
  payload: Extract<Job, { tag: T }>['payload']
): Promise<void> {
  console.log(`Queueing job ${tag}`, payload)
  // Without .start, it doesn't work for whatever reason
  await boss.start()
  const id = await boss.send('jobs', { tag, payload } satisfies Job)
  if (id === null) {
    throw new Error('Failed to queue job')
  } else {
    console.log(`Queued job ${tag} with id ${id}`)
  }
}

export async function startJobQueueProcessing() {
  boss.on('error', (err) => {
    console.error(`pg-boss error: ${err.message}`)
  })
  await boss.start()
  await boss.work<Job>('jobs', async (job) => {
    console.log(`Processing job ${job.id}`, job.data)
    try {
      switch (job.data.tag) {
        case 'beeminder-sync-card': {
          await beeminderSyncCard(job.data.payload)
          break
        }
        default: {
          throw new Error(`Unknown job type`)
        }
      }
    } catch (err) {
      console.error(`Error processing job ${job.id}`, job.data, err)
    }
  })
}
